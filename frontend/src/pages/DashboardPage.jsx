import { useEffect, useState } from "react";
import { useAuth } from "../components/AuthContext";
import { getSocket, joinTenantRoom, leaveTenantRoom } from "../components/socket";

export function DashboardPage() {
  const { user } = useAuth();
  const [socketState, setSocketState] = useState("disconnected");

  useEffect(() => {
    if (!user?.tenantId) return;

    const socket = getSocket();

    function onConnect() {
      setSocketState("connected");
      joinTenantRoom(user.tenantId);
    }

    function onDisconnect() {
      setSocketState("disconnected");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      leaveTenantRoom(user.tenantId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [user?.tenantId]);

  return (
    <section className="card">
      <h2>Dashboard</h2>
      <p><strong>User:</strong> {user?.fullName}</p>
      <p><strong>Role:</strong> {user?.role}</p>
      <p><strong>Tenant ID:</strong> {String(user?.tenantId)}</p>
      <p><strong>Socket:</strong> {socketState}</p>

      <hr />
      <h3>Learning TODOs</h3>
      <ol>
        <li>Build announcement list + create form</li>
        <li>Build ticket create + status board</li>
        <li>Build event calendar list</li>
        <li>Build amenity booking conflict UI</li>
      </ol>
    </section>
  );
}
