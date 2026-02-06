import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InvoiceExportOptions {
  format: 'pdf' | 'excel';
  invoiceId?: string;
  month?: number;
  year?: number;
  includeAll?: boolean;
}

export function useAgencyInvoiceExports() {
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = async (
    url: string,
    fileName: string,
    format: 'pdf' | 'excel'
  ) => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Limpar nome do arquivo de caracteres especiais
      const cleanFileName = fileName
        .replace(/[^\w\s-çãõâêôúàéèíì.]/gi, '')
        .replace(/\s+/g, '_')
        .toLowerCase();
      
      const finalFileName = cleanFileName.endsWith(format === 'pdf' ? '.pdf' : '.xlsx')
        ? cleanFileName
        : `${cleanFileName}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

      // Criar blob URL e disparar download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Arquivo ${finalFileName} baixado com sucesso`);
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  };

  const exportInvoice = async (options: InvoiceExportOptions) => {
    setIsExporting(true);
    try {
      if (!options.invoiceId) {
        throw new Error('Invoice ID is required for single invoice export');
      }

      const response = await supabase.functions.invoke(
        options.format === 'pdf' ? 'generate-invoice-pdf' : 'generate-invoice-excel',
        {
          body: {
            invoiceId: options.invoiceId,
            format: options.format
          }
        }
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { downloadUrl, fileName } = response.data;
      await downloadFile(downloadUrl, fileName, options.format);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao exportar fatura';
      toast.error(errorMessage);
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportMonthly = async (month: number, year: number, format: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const response = await supabase.functions.invoke(
        format === 'pdf' ? 'generate-invoice-pdf' : 'generate-invoice-excel',
        {
          body: {
            month,
            year,
            format
          }
        }
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { downloadUrl, fileName } = response.data;
      await downloadFile(downloadUrl, fileName, format);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao exportar relatório';
      toast.error(errorMessage);
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportRange = async (
    startMonth: number,
    startYear: number,
    endMonth: number,
    endYear: number,
    format: 'pdf' | 'excel'
  ) => {
    setIsExporting(true);
    try {
      const response = await supabase.functions.invoke(
        format === 'pdf' ? 'generate-invoice-pdf' : 'generate-invoice-excel',
        {
          body: {
            startMonth,
            startYear,
            endMonth,
            endYear,
            format
          }
        }
      );

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { downloadUrl, fileName } = response.data;
      await downloadFile(downloadUrl, fileName, format);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao exportar período';
      toast.error(errorMessage);
      console.error('Export error:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportInvoice,
    exportMonthly,
    exportRange,
  };
}
