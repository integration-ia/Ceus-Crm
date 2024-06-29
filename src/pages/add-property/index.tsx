import { type ReactNode } from "react";
import CmsLayout from "~/components/layout/cms-layout";
import Greeter from "~/components/ui/greeter";
import PageContainer from "~/components/ui/page-container";
import PropertyForm from "~/forms/property-form/property-form";
import { APIProvider } from "@vis.gl/react-google-maps";
import { env } from "~/env";

const AddPropertyPage = () => {
  return (
    <PageContainer>
      <Greeter
        title="Crear inmueble"
        subtitle="Crea un inmueble para la página de tu empresa"
      />
      <APIProvider apiKey={env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <PropertyForm />
      </APIProvider>
    </PageContainer>
  );
};

AddPropertyPage.getLayout = (page: ReactNode) => {
  return <CmsLayout>{page}</CmsLayout>;
};

export default AddPropertyPage;
