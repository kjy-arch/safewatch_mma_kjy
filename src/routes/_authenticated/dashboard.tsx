import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Tags, Clock, CheckCircle2, Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { runRssCrawl } from "@/lib/rss-crawler";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function statusBadge(status: string) {
  if (status === "completed") return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">완료</Badge>;
  if (status === "pending") return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">대기</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function DashboardPage() {
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [today, keywords, pending, completed] = await Promise.all([
        supabase.from("crawled_posts").select("*", { count: "exact", head: true }).gte("detected_at", startOfDay.toISOString()),
        supabase.from("keywords").select("*", { count: "exact", head: true }),
        supabase.from("crawled_posts").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("crawled_posts").select("*", { count: "exact", head: true }).eq("status", "completed"),
      ]);

      return {
        today: today.count ?? 0,
        keywords: keywords.count ?? 0,
        pending: pending.count ?? 0,
        completed: completed.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["recent-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crawled_posts")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const detectMut = useMutation({
    mutationFn: () => runRssCrawl(),
    onSuccess: (count) => {
      toast.success(`탐지 완료 — 총 ${count}건이 저장되었습니다`);
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recent-posts"] });
      qc.invalidateQueries({ queryKey: ["crawled_posts"] });
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "NO_ACTIVE_KEYWORDS") {
        toast.error("등록된 활성 키워드가 없습니다");
      } else {
        toast.error(e instanceof Error ? e.message : "오류가 발생했습니다");
      }
    },
  });

  const cards = [
    { label: "오늘 탐지 건수", value: stats?.today ?? 0, icon: Activity, color: "text-blue-600 bg-blue-50" },
    { label: "등록 키워드 수", value: stats?.keywords ?? 0, icon: Tags, color: "text-violet-600 bg-violet-50" },
    { label: "처리 대기", value: stats?.pending ?? 0, icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "처리 완료", value: stats?.completed ?? 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">대시보드</h1>
          <p className="mt-1 text-sm text-muted-foreground">모니터링 현황을 한눈에 확인하세요</p>
        </div>
        <Button
          onClick={() => detectMut.mutate()}
          disabled={detectMut.isPending}
          className="sm:self-start"
        >
          {detectMut.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          {detectMut.isPending ? "탐지 중..." : "탐지 실행"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{c.value.toLocaleString()}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c.color}`}>
                <c.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 탐지 게시글</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사이트명</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>키워드</TableHead>
                <TableHead>탐지시간</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent && recent.length > 0 ? (
                recent.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.site_name}</TableCell>
                    <TableCell className="max-w-md truncate">{p.title}</TableCell>
                    <TableCell><Badge variant="outline">{p.keyword}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.detected_at).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    탐지된 게시글이 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}