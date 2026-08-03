import OfflineScreenComponent from "@/components/offline.component";
import useOnlineStatus from "@/hooks/useOnline.hook";
import RootLayout from "@/layouts/root.layout";

function App() {
  const isOnline = useOnlineStatus();

  return isOnline ? <RootLayout /> : <OfflineScreenComponent />;
}

export default App;
