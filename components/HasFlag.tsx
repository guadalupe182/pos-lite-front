'use client'

import React from 'react';
import { useFlags } from "@/contexts/FlagContext";

interface Props {
    name: string;
    children: React.ReactNode;
}

export const HasFlag = ({ name, children }: Props) => {
  //Consumimos la "llave" que creamos al final de FlagContext
  const { hasFlag } = useFlags();

  //En entorno local de desarrollo permite ver las secciones para pruebas
    const isDev = process.env.NODE_ENV === 'development';

  //Si no tiene el módulo contratado, dedvolvemos null (no renderiza nada en HTML)
    if(!hasFlag(name)) return null;
    return <>{children}</>;
};