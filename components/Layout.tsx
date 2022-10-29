import clsx from "clsx";
import React from "react";

type Props = {
  className?: string;
  children?: React.ReactNode;
};

function Layout({ children, className }: Props) {
  return (
    <main className={clsx("max-w-6xl mx-auto p-10 pt-2", className)}>
      {children}
    </main>
  );
}

export default Layout;
