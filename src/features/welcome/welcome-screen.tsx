import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";

interface WelcomeScreenProps {
  onStepFinished: () => void;
}

const animatedWords = [
  "Crea",
  "Gestiona",
  "Envía",
  "Enlaza",
  "Sube",
  "Observa",
];

const WelcomeScreen = ({ onStepFinished }: WelcomeScreenProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity((prevOpacity) => (prevOpacity === 1 ? 0 : 1));
    }, 400); // Change opacity every 0.4 seconds

    return () => clearInterval(interval);
  }, []);
  return (
    <>
      <h1 className="text-4xl">Bienvenido a</h1>
      <Image
        src="/assets/logo-hires.webp"
        alt="Logo de CEUS a color"
        width={137}
        height={200}
      />
      <div className="flex flex-col items-center justify-between gap-2">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: opacity }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
          className="inline-block text-lg font-bold"
          onAnimationStart={() => {
            if (opacity !== 0) {
              setCurrentWordIndex((prevIndex) =>
                prevIndex === animatedWords.length - 1 ? 0 : prevIndex + 1,
              );
            }
          }}
        >
          {animatedWords[currentWordIndex]}
        </motion.p>
        <p className="text-center text-lg text-muted-foreground">
          todo en CEUS
        </p>
      </div>

      <Button className="max-w-fit" onClick={onStepFinished}>
        <CheckCircle className="mr-2 h-4 w-4" />
        Comenzar
      </Button>
    </>
  );
};

export default WelcomeScreen;
