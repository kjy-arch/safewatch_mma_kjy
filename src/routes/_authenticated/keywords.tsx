import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/keywords")({
  component: KeywordsPage,
});

function KeywordsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");

  const { data: keywords } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => {
      const { data, error } = await supabase.from("keywords").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMut = useMutation({
    mutationFn: async (kw: string) => {
      const { error } = await supabase.from("keywords").insert({ keyword: kw, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("키워드가 추가되었습니다");
      setKeyword("");
      qc.invalidateQueries({ queryKey: ["keywords"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("keywords").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("삭제되었습니다");
      qc.invalidateQueries({ queryKey: ["keywords"] });
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    addMut.mutate(keyword.trim());
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">키워드 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">모니터링할 키워드를 등록하고 관리하세요</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">새 키워드 추가</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              placeholder="예: 불법도박, 허위광고"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <Button type="submit" disabled={addMut.isPending}>추가</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">등록된 키워드 ({keywords?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {keywords && keywords.length > 0 ? (
            <ul className="divide-y">
              {keywords.map((k) => (
                <li key={k.id} className="flex items-center justify-between py-3">
                  <span className="font-medium">{k.keyword}</span>
                  <Button variant="ghost" size="sm" onClick={() => delMut.mutate(k.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">등록된 키워드가 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
