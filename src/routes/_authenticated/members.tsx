import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type Role = "admin" | "viewer";
type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/members")({
  component: MembersPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function MembersPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Member[];
    },
  });

  const addMut = useMutation({
    mutationFn: async (payload: { name: string; email: string; role: Role }) => {
      const { error } = await supabase.from("members").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("실무자가 추가되었습니다");
      setName("");
      setEmail("");
      setRole("viewer");
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("삭제되었습니다");
      setDeletingId(null);
      qc.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "오류"),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("이름을 입력해주세요");
      return;
    }
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("올바른 이메일 형식이 아닙니다");
      return;
    }
    addMut.mutate({ name: name.trim(), email: email.trim(), role });
  };

  const roleBadge = (r: Role) =>
    r === "admin" ? (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        관리자
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
        열람자
      </Badge>
    );

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">실무자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          시스템 접근 권한을 가진 실무자를 관리하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 실무자 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:w-40"
            />
            <Input
              placeholder="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">관리자</SelectItem>
                <SelectItem value="viewer">열람자</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={addMut.isPending}>
              실무자 추가
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            등록된 실무자 ({members?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>이메일</TableHead>
                <TableHead>권한</TableHead>
                <TableHead>등록일</TableHead>
                <TableHead className="text-right">삭제</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members && members.length > 0 ? (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-sm">{m.email}</TableCell>
                    <TableCell>{roleBadge(m.role)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(m.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    등록된 실무자가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              삭제된 실무자 정보는 복구할 수 없습니다.
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
