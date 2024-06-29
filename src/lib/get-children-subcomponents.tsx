import { Children, type FC, type ReactElement } from "react";

type TComponent = FC<{ displayName: string }>;

export const getChildrenSubcomponents = (
  children: ReactElement,
  displayName: string,
) => {
  return Children.map(children, (child: ReactElement) => {
    return (child?.type as TComponent).displayName === displayName
      ? child
      : null;
  });
};
