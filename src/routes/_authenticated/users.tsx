import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/users")({
  component: UsersPage,
});

function UsersPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">실무자 관리</h1>
        <p className="mt-1 text-sm text-muted-foreground">시스템 사용자 정보</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">현재 사용자</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 rounded-md border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">활성 실무자</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            ※ 실무자 초대 및 권한 관리 기능은 추후 확장될 예정입니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
