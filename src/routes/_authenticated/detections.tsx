import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/detections")({
  component: DetectionsPage,
});

function statusBadge(status: string) {
  if (status === "completed") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">완료</Badge>;
  if (status === "pending") return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">대기</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

function DetectionsPage() {
  const qc = useQueryClient();
  const { data: posts } = useQuery({
    queryKey: ["all-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("crawled_posts").select("*").order("detected_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("crawled_posts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("상태가 변경되었습니다");
      qc.invalidateQueries({ queryKey: ["all-posts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recent-posts"] });
    },
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">탐지 결과</h1>
        <p className="mt-1 text-sm text-muted-foreground">탐지된 게시글을 확인하고 처리 상태를 관리하세요</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">전체 탐지 게시글 ({posts?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사이트명</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>키워드</TableHead>
                <TableHead>탐지시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts && posts.length > 0 ? (
                posts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.site_name}</TableCell>
                    <TableCell className="max-w-md truncate">{p.title}</TableCell>
                    <TableCell><Badge variant="outline">{p.keyword}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.detected_at).toLocaleString("ko-KR")}
                    </TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-right">
                      {p.status !== "completed" && (
                        <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: p.id, status: "completed" })}>
                          완료 처리
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
