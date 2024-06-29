import { useState, type ReactNode } from "react";
import CmsLayout from "~/components/layout/cms-layout";
import Greeter from "~/components/ui/greeter";
import MenuNavigator from "~/components/ui/menu-navigator";
import PageContainer from "~/components/ui/page-container";
import MyAccountInfo from "~/features/my-account/my-account-info";

const MyAccountPage = () => {
  const [activeTab, setActiveTab] = useState<"general" | "mySubscription">(
    "general",
  );

  return (
    <PageContainer>
      <Greeter
        title="Mi perfil"
        subtitle="Administra la información de tu perfil"
      />
      <div className="flex flex-col gap-4 md:flex-row">
        <div>
          <MenuNavigator
            title="Configuración"
            items={[
              {
                label: "General",
                onClick: () => {
                  setActiveTab("general");
                },
                isActive: activeTab === "general",
              },
            ]}
          />
        </div>
        <MyAccountInfo />
      </div>
    </PageContainer>
  );
};

MyAccountPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default MyAccountPage;
