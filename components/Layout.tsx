import React from "react";

type Props = {
  children?: React.ReactNode;
};

function Layout({ children }: Props) {
  return <main className="max-w-6xl mx-auto p-10 pt-2">{children}</main>;
}

export default Layout;
