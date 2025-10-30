import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Login() {
  const handleSignIn = () => {
    // Simple redirect to dashboard without authentication
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">
            House Management System
          </CardTitle>
          <CardDescription>
            ระบบจัดการข้อมูลบ้านและสมาชิก
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>ยินดีต้อนรับสู่ระบบจัดการบ้าน</p>
            <p>กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ</p>
          </div>
          
          <Button 
            onClick={handleSignIn}
            className="w-full h-12 text-lg"
            size="lg"
          >
            เข้าสู่ระบบ
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
