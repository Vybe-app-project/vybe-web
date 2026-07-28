import { useEffect } from "react";
import { useAdminRouter } from "../../routing";
import { AdminSessionProvider } from "../../context/admin-session";
import { getAdminToken } from "../../utils/adminAuthStorage";

export default function AppLayout({children}){

    const { navigate } = useAdminRouter()

      useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

    return (
        <AdminSessionProvider>
        {children}
        </AdminSessionProvider>
    )
}
