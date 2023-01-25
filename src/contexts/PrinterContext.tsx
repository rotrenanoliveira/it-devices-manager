import React, { createContext, useCallback, useEffect, useState } from "react";
import { InkColors } from "../utils/inks";

export interface InkStock {
  amount: number;
  color: InkColors;
}

export interface Printer {
  id: number;
  name: string;
  isColorful: true;
  stock: InkStock[];
  category: "printer";
  department: "qualidade" | "pcp" | "custos" | "rh";
}

interface InkStockHistory {
  id: number;
  date: Date;
  amount: number;
  color: InkColors;
  deliveryTo?: string;
  type: "income" | "outcome";
  printer_id: number | string;
}

interface PrinterContextProps {
  printers: Printer[];
  hasInkStockAlert: boolean;
  printerEmptyInkStock: InkStock[];
  inkStockHistory: InkStockHistory[];
  selectedPrinter: Printer | undefined;
  loadInStockHistory: () => void;
  selectPrinter: (printerId: number) => void;
  addInk: (printerId: number, ink: InkStock) => void;
  removeInk: (printerId: number, ink: InkStock) => void;
}

export const PrinterContext = createContext({} as PrinterContextProps);

interface PrinterContextProviderProps {
  children: React.ReactNode;
}

export function PrinterContextProvider({ children }: PrinterContextProviderProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | undefined>(undefined);

  async function loadPrinters() {
    const response = await fetch("http://localhost:3333/printers");
    const data = await response.json();

    setPrinters(data);
  }

  function selectPrinter(printerId: number) {
    const printer = printers.find((printer) => printer.id === printerId);

    if (!printer) {
      return console.error("PRINTER NOT FOUND");
    }

    setSelectedPrinter(printer);
  }

  async function addInk(printerId: number, ink: InkStock) {
    const updatedInkStock = selectedPrinter!.stock.map((state) => {
      if (state.color !== ink.color) {
        return state;
      }

      return {
        ...state,
        amount: state.amount + 1,
      };
    });

    const printer = {
      ...selectedPrinter!,
      stock: updatedInkStock,
    };

    const response = await fetch(`http://localhost:3333/printers/${printerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(printer),
    });

    if (response.status === 200) {
      setSelectedPrinter(printer);
      loadPrinters();
    }
  }

  async function removeInk(printerId: number, ink: InkStock) {
    const updatedInkStock = selectedPrinter!.stock.map((state) => {
      if (state.color !== ink.color) {
        return state;
      }

      if (state.amount === 0) return state;

      return {
        ...state,
        amount: state.amount - 1,
      };
    });

    const printer = {
      ...selectedPrinter!,
      stock: updatedInkStock,
    };

    const response = await fetch(`http://localhost:3333/printers/${printerId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(printer),
    });

    if (response.status === 200) {
      setSelectedPrinter(printer);
      loadPrinters();
    }
  }

  useEffect(() => {
    loadPrinters();
  }, []);

  const [inkStockHistory, setInkStoryHistory] = useState<InkStockHistory[]>([]);

  const loadInStockHistory = useCallback(async () => {
    const response = await fetch(`http://localhost:3333/ink-stock-history?printer_id=${selectedPrinter!.id}`);
    const data: InkStockHistory[] = await response.json();
    setInkStoryHistory(data);
  }, [selectedPrinter]);

  useEffect(() => {
    if (selectedPrinter) {
      loadInStockHistory();
    }
  }, [selectedPrinter, loadInStockHistory]);

  const [printerEmptyInkStock, setPrinterEmptyInkStock] = useState<InkStock[]>([]);
  const [hasInkStockAlert, setHasInkStockAlert] = useState(false);

  useEffect(() => {
    if (selectedPrinter) {
      const emptyInks = selectedPrinter.stock.filter((ink) => ink.amount === 0);

      setPrinterEmptyInkStock(emptyInks);
      setHasInkStockAlert(!!emptyInks.length);
    }
  }, [selectedPrinter]);

  return (
    <PrinterContext.Provider
      value={{
        printers,
        selectedPrinter,
        inkStockHistory,
        hasInkStockAlert,
        printerEmptyInkStock,
        addInk,
        removeInk,
        selectPrinter,
        loadInStockHistory,
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
}
