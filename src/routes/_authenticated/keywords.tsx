import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Severity = "low" | "medium" | "high";
type Keyword = {
  id: string;
  keyword: string;
  severity: Severity;
  is_active: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/keywords")({
  component: KeywordsPage,
});

const severityMeta: Record<Severity, { label: string; className: string }> = {
  low: { label: "낮음", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  medium: { label: "중간", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  high: { label: "높음", className: "bg-red-100 text-red-700 hover:bg-red-100" },
};

function KeywordsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: keywords } = useQuery({
    queryKey: ["keywords"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keywords")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Keyword[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["keywords"] });

  const addMut = useMutation({
    mutationFn: async (payload: { keyword: string; severity: Severity }) => {
      const { error } = await supabase.from("keywords").insert({
        keyword: payload.keyword,
        severity: payload.severity,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("키워드가 추가되었습니다");
      setKeyword("");
      setSeverity("medium");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const updateMut = useMutation({
    mutationFn: async (payload: Partial<Keyword> & { id: string }) => {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("keywords").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const editMut = useMutation({
    mutationFn: async (payload: { id: string; keyword: string; severity: Severity }) => {
      const { error } = await supabase
        .from("keywords")
        .update({ keyword: payload.keyword, severity: payload.severity })
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("수정되었습니다");
      setEditing(null);
      invalidate();
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
      setDeletingId(null);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) {
      toast.error("키워드를 입력해주세요");
      return;
    }
    addMut.mutate({ keyword: keyword.trim(), severity });
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">키워드 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          모니터링할 키워드를 등록하고 관리하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 키워드 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="예: 불법도박, 허위광고"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Select value={severity} onValueChange={(v) => setSeverity(v as Severity)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">낮음</SelectItem>
                <SelectItem value="medium">중간</SelectItem>
                <SelectItem value="high">높음</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={addMut.isPending}>
              키워드 추가
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            등록된 키워드 ({keywords?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>키워드</TableHead>
                <TableHead>위험도</TableHead>
                <TableHead>활성여부</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">수정</TableHead>
                <TableHead className="text-right">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keywords && keywords.length > 0 ? (
                keywords.map((k) => {
                  const meta = severityMeta[k.severity] ?? severityMeta.medium;
                  return (
                    <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={meta.className}>
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={k.is_active}
                          onCheckedChange={(checked) =>
                            updateMut.mutate({ id: k.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(k.created_at).toLocaleDateString("ko-KR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(k)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(k.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    등록된 키워드가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditDialog
        keyword={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => editMut.mutate(payload)}
        saving={editMut.isPending}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 키워드는 복구할 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && delMut.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditDialog({
  keyword,
  onClose,
  onSave,
  saving,
}: {
  keyword: Keyword | null;
  onClose: () => void;
  onSave: (payload: { id: string; keyword: string; severity: Severity }) => void;
  saving: boolean;
}) {
  const [value, setValue] = useState("");
  const [sev, setSev] = useState<Severity>("medium");

  // Reset state when opening
  const open = !!keyword;
  if (keyword && value === "" && sev === "medium" && keyword.keyword !== "") {
    // initialize once per open
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        onOpenAutoFocus={() => {
          if (keyword) {
            setValue(keyword.keyword);
            setSev(keyword.severity);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>키워드 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-keyword">키워드</Label>
            <Input
              id="edit-keyword"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>위험도</Label>
            <Select value={sev} onValueChange={(v) => setSev(v as Severity)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">낮음</SelectItem>
                <SelectItem value="medium">중간</SelectItem>
                <SelectItem value="high">높음</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            disabled={saving || !value.trim()}
            onClick={() => {
              if (!value.trim()) {
                toast.error("키워드를 입력해주세요");
                return;
              }
              if (keyword) onSave({ id: keyword.id, keyword: value.trim(), severity: sev });
            }}
          >
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
