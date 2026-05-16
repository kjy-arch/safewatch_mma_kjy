import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Post = {
  id: string;
  site_name: string;
  title: string;
  url: string | null;
  matched_keyword: string | null;
  keyword: string;
  status: string;
  detected_at: string;
};

export const Route = createFileRoute("/_authenticated/detections")({
  component: DetectionsPage,
});

function DetectionsPage() {
  const qc = useQueryClient();
  const [site, setSite] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data: posts } = useQuery({
    queryKey: ["crawled_posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crawled_posts")
        .select("*")
        .order("detected_at", { ascending: false });
      if (error) throw error;
      return data as Post[];
    },
  });

  const sites = useMemo(() => {
    const set = new Set<string>();
    posts?.forEach((p) => p.site_name && set.add(p.site_name));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    return (posts ?? []).filter((p) => {
      if (site !== "all" && p.site_name !== site) return false;
      if (status !== "all" && p.status !== status) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const kw = (p.matched_keyword ?? p.keyword ?? "").toLowerCase();
        if (!kw.includes(q)) return false;
      }
      return true;
    });
  }, [posts, site, search, status]);

  const completeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crawled_posts")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("처리 완료되었습니다");
      qc.invalidateQueries({ queryKey: ["crawled_posts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["recent-posts"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const statusBadge = (s: string) => {
    if (s === "completed")
      return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">완료</Badge>;
    return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">대기중</Badge>;
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">탐지 결과</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          크롤링된 게시글을 확인하고 처리하세요
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="사이트" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 사이트</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="키워드 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="completed">처리완료</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            탐지 결과 ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>사이트명</TableHead>
                <TableHead>제목</TableHead>
                <TableHead>매칭 키워드</TableHead>
                <TableHead>탐지시간</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">원문보기</TableHead>
                <TableHead className="text-right">처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((p) => {
                  const kw = p.matched_keyword ?? p.keyword;
                  const done = p.status === "completed";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.site_name}</TableCell>
                      <TableCell className="max-w-xs truncate">{p.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{kw}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.detected_at).toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell>{statusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!p.url}
                          onClick={() =>
                            p.url && window.open(p.url, "_blank", "noopener,noreferrer")
                          }
                        >
                          <ExternalLink className="mr-1 h-4 w-4" />
                          원문
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={done ? "secondary" : "default"}
                          disabled={done || completeMut.isPending}
                          onClick={() => completeMut.mutate(p.id)}
                        >
                          {done ? "완료" : "처리완료"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    탐지 결과가 없습니다
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
