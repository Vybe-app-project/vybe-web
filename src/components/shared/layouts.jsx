import { useEffect } from "react";
import { useAdminRouter } from "../../routing";

export default function AppLayout({children}){

    const { navigate } = useAdminRouter()

      useEffect(() => {
    const token = window.localStorage.getItem("access_token");
    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

    return (
        <>
        {children}
        </>
    )
}
