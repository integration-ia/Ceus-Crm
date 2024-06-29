import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import AccountConfiguration from "~/features/welcome/account-configuration";
import OrganizationConfiguration from "~/features/welcome/organization-configuration";
import WelcomeScreen from "~/features/welcome/welcome-screen";

const WelcomePage = () => {
  const router = useRouter();

  const session = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in").catch(console.error);
    },
  });

  const [step, setStep] = useState(1);

  useEffect(() => {
    if (
      session.data?.user &&
      session.data?.user.firstName &&
      session.data?.user.lastName &&
      session.data?.user.email &&
      session.data?.user.phoneNumber &&
      session.data?.user.countryCode
    ) {
      setStep(3);
    }
  }, [session.data?.user]);

  if (!session.data?.user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Cargando</h1>
        <p>Por favor espera un momento...</p>
        <LoadingSpinner className="mt-4 h-16 w-16" />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="h-screen w-full">
        <div className="flex justify-end p-4">
          <Button
            variant="link"
            onClick={() => {
              signOut().catch(console.error);
            }}
          >
            Cerrar sesión
          </Button>
        </div>

        <div className="mt-20 flex flex-col items-center justify-center gap-10">
          <WelcomeScreen
            onStepFinished={() => {
              setStep(2);
            }}
          />
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <div className="flex justify-end p-4">
          <Button
            variant="link"
            onClick={() => {
              signOut().catch(console.error);
            }}
          >
            Cerrar sesión
          </Button>
        </div>
        <AccountConfiguration
          onStepFinished={() => {
            setStep(3);
          }}
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <div className="flex justify-end p-4">
          <Button
            variant="link"
            onClick={() => {
              signOut().catch(console.error);
            }}
          >
            Cerrar sesión
          </Button>
        </div>
        <OrganizationConfiguration
          onStepFinished={() => {
            router.push("/dashboard").catch(console.error);
          }}
        />
      </div>
    );
  }

  return <></>;
};

export default WelcomePage;
