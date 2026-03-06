import { useState, useCallback } from 'react';
import type { BankAccount } from '../models/BankAccount';
import type { ExportFile, ExportedResult } from '../models/ExportFile';
import { serializeToExportFile } from '../transfer/dataSerializer';
import { downloadJson, readJsonFile } from '../transfer/fileIO';
import { validateExportFile } from '../transfer/importValidator';

export type ImportMode = 'replace' | 'merge';

export interface ImportPreview {
  file: ExportFile;
  resultCount: number;
  portfolioIdCount: number;
}

export function useDataTransfer(
  results: BankAccount[],
  portfolioIds: Set<string>,
  replaceResults: (results: ExportedResult[]) => void,
  mergeResults: (results: ExportedResult[]) => void,
  replacePortfolio: (ids: string[]) => void,
  mergePortfolio: (ids: string[]) => void,
) {
  const [pendingImport, setPendingImport] = useState<ImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const exportFile = serializeToExportFile(results, portfolioIds);
    const date = new Date().toISOString().slice(0, 10);
    downloadJson(exportFile, `moneygrip-export-${date}.json`);
  }, [results, portfolioIds]);

  const handleFileSelected = useCallback(async (file: File) => {
    setImportError(null);
    setPendingImport(null);

    try {
      const raw = await readJsonFile(file);
      const validation = validateExportFile(raw);

      if (!validation.ok) {
        setImportError(validation.error);
        return;
      }

      setPendingImport({
        file: validation.data,
        resultCount: validation.data.results.length,
        portfolioIdCount: validation.data.portfolioIds.length,
      });
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Onbekende fout bij het lezen van het bestand.');
    }
  }, []);

  const handleConfirmImport = useCallback((mode: ImportMode) => {
    if (!pendingImport) return;

    const { results: importedResults, portfolioIds: importedPortfolioIds } = pendingImport.file;

    if (mode === 'replace') {
      replaceResults(importedResults);
      replacePortfolio(importedPortfolioIds);
    } else {
      mergeResults(importedResults);
      mergePortfolio(importedPortfolioIds);
    }

    setPendingImport(null);
    setImportError(null);
  }, [pendingImport, replaceResults, mergeResults, replacePortfolio, mergePortfolio]);

  const handleCancelImport = useCallback(() => {
    setPendingImport(null);
    setImportError(null);
  }, []);

  return {
    handleExport,
    pendingImport,
    importError,
    handleFileSelected,
    handleConfirmImport,
    handleCancelImport,
  };
}
