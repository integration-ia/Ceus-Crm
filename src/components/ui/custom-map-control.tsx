import React, { useEffect, useState } from "react";
import { type ControlPosition, MapControl } from "@vis.gl/react-google-maps";

import MapAutocomplete from "./map-autocomplete";

type CustomAutocompleteControlProps = {
  controlPosition: ControlPosition;
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
};

export const CustomMapControl = ({
  controlPosition,
  onPlaceSelect,
}: CustomAutocompleteControlProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? (
    <MapControl position={controlPosition}>
      <MapAutocomplete onPlaceSelect={onPlaceSelect} />
    </MapControl>
  ) : null;
};
