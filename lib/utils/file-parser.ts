/**
 * UTILITĂȚI PARSARE FIȘIERE
 *
 * EXPLICAȚIE:
 * Funcții pentru parsarea fișierelor CSV, Excel și PDF în tranzacții.
 *
 * CONCEPTE:
 * - CSV = Comma-Separated Values (valori separate prin virgulă)
 * - Excel = Format binar (.xlsx) al Microsoft
 * - PDF = Portable Document Format (extrase bancare)
 * - Parser = Funcție care transformă text/binary în obiecte JavaScript
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Tipul pentru o tranzacție parsată
 */
export interface ParsedTransaction {
  date: string; // Format: YYYY-MM-DD
  description: string;
  amount: number;
  currency?: string;
  type?: "debit" | "credit";
  originalData?: any; // Datele originale din fișier
}

/**
 * Rezultatul parsării
 */
export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  error?: string;
  rowCount?: number;
}

/**
 * FUNCȚIA 1: Parse CSV
 *
 * Parsează un fișier CSV și extrage tranzacțiile.
 * SUPORT MULTI-FORMAT: Funcționează automat cu diverse formate bancare:
 * - Bănci românești (ING, BCR, BT, Revolut RO): date, descriere, suma, moneda
 * - Bănci rusești/internaționale: Дата, Описание, Сумма, Валюта
 * - Format cu dată timestamp: YYYY-MM-DD HH:MM:SS
 * - Encoding: UTF-8 (suport complet pentru diacritice și Cyrillic)
 *
 * PARAMETRI:
 * @param file - Fișierul CSV (File object din input)
 * @returns Promise cu rezultatul parsării
 *
 * EXEMPLU CSV ROMÂNESC:
 * date,description,amount,currency
 * 01.12.2025,MEGA IMAGE,-45.50,RON
 * 02.12.2025,Salariu,5000.00,RON
 *
 * EXEMPLU CSV RUSESC:
 * Тип,Продукт,Дата начала,Дата выполнения,Описание,Сумма,Комиссия,Валюта
 * Переводы,Сбережения,2025-12-02 08:57:52,2025-12-02 08:57:52,В кошелек,0.10,0.00,EUR
 */
export async function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true, // Prima linie = header-e (nume coloane)
      skipEmptyLines: true, // Ignoră liniile goale
      encoding: 'UTF-8', // Suport pentru caractere speciale (română, rusă, etc)
      complete: (results) => {
        try {
          // Verificăm dacă avem date
          if (!results.data || results.data.length === 0) {
            resolve({
              success: false,
              transactions: [],
              error: "Fișierul CSV este gol",
            });
            return;
          }

          // Transformăm fiecare rând în tranzacție
          const transactions: ParsedTransaction[] = [];

          results.data.forEach((row: any, index: number) => {
            try {
              // Detectăm automat coloanele (flexibil pentru diverse formate)
              const date = detectDate(row);
              const description = detectDescription(row);
              const amount = detectAmount(row);
              const currency = detectCurrency(row);

              if (date && description && amount !== null) {
                transactions.push({
                  date: formatDate(date),
                  description: description.trim(),
                  amount: parseFloat(amount),
                  currency: currency || "RON",
                  type: parseFloat(amount) < 0 ? "debit" : "credit",
                  originalData: row, // Păstrăm datele originale
                });
              }
            } catch (err) {
              console.warn(`Eroare la parsarea rândului ${index + 1}:`, err);
            }
          });

          resolve({
            success: true,
            transactions,
            rowCount: results.data.length,
          });
        } catch (error: any) {
          resolve({
            success: false,
            transactions: [],
            error: error.message,
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          transactions: [],
          error: error.message,
        });
      },
    });
  });
}

/**
 * FUNCȚIA 2: Parse Excel
 *
 * Parsează un fișier Excel (.xlsx) și extrage tranzacțiile.
 */
export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({
            success: false,
            transactions: [],
            error: "Nu s-a putut citi fișierul",
          });
          return;
        }

        // Parsăm Excel-ul
        const workbook = XLSX.read(data, { type: "binary" });

        // Luăm prima foaie (sheet)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convertim în JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        console.log('[parseExcel] Sheet name:', sheetName);
        console.log('[parseExcel] Total rows:', jsonData.length);
        console.log('[parseExcel] First row sample:', jsonData[0]);
        console.log('[parseExcel] Column headers:', Object.keys(jsonData[0] || {}));

        if (jsonData.length === 0) {
          resolve({
            success: false,
            transactions: [],
            error: "Fișierul Excel este gol",
          });
          return;
        }

        // Transformăm în tranzacții (similar cu CSV)
        const transactions: ParsedTransaction[] = [];

        jsonData.forEach((row: any, index: number) => {
          try {
            const date = detectDate(row);
            const description = detectDescription(row);
            const amount = detectAmount(row);
            const currency = detectCurrency(row);

            if (index < 3) {
              console.log(`[parseExcel] Row ${index}:`, {
                date,
                description,
                amount,
                currency,
                rawRow: row
              });
            }

            if (date && description && amount !== null) {
              transactions.push({
                date: formatDate(date),
                description: description.trim(),
                amount: parseFloat(amount),
                currency: currency || "RON",
                type: parseFloat(amount) < 0 ? "debit" : "credit",
                originalData: row,
              });
            } else {
              if (index < 5) {
                console.warn(`[parseExcel] Skipping row ${index} - missing data:`, {
                  hasDate: !!date,
                  hasDescription: !!description,
                  hasAmount: amount !== null,
                  row
                });
              }
            }
          } catch (err) {
            console.warn(`[parseExcel] Eroare la parsarea rândului ${index}:`, err);
          }
        });

        resolve({
          success: true,
          transactions,
          rowCount: jsonData.length,
        });
      } catch (error: any) {
        resolve({
          success: false,
          transactions: [],
          error: error.message,
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        transactions: [],
        error: "Eroare la citirea fișierului",
      });
    };

    reader.readAsBinaryString(file);
  });
}

/**
 * FUNCȚIA 3: Parse PDF extras Banca Transilvania
 *
 * Parser specific pentru formatul BT:
 * Coloane: Data | Descriere | Debit | Credit
 * Date format: DD/MM/YYYY
 * Rânduri ignorate: RULAJ ZI, SOLD FINAL ZI, SOLD ANTERIOR, RULAJ TOTAL CONT
 */
export async function parsePDF(file: File): Promise<ParseResult> {
  try {
    // Import dinamic — pdfjs-dist e mare, îl încărcăm doar când e necesar
    const pdfjsLib = await import("pdfjs-dist");

    // Importăm worker-ul direct ca URL (Next.js îl va bundle automat)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const workerUrl = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    // Extragem textul din toate paginile
    const allLines: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Grupăm elementele text pe rânduri după coordonata Y
      const itemsByY = new Map<number, string[]>();
      for (const item of textContent.items) {
        if (!("str" in item)) continue;
        const y = Math.round((item as { transform: number[] }).transform[5]);
        const existing = itemsByY.get(y) ?? [];
        existing.push((item as { str: string }).str);
        itemsByY.set(y, existing);
      }

      // Sortăm rândurile de sus în jos (Y descrescător în PDF)
      const sortedRows = Array.from(itemsByY.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([, texts]) => texts.join(" ").trim());

      allLines.push(...sortedRows);
    }

    console.log("[parsePDF] Total lines extracted:", allLines.length);
    console.log("[parsePDF] First 50 lines:", allLines.slice(0, 50));
    return parseBTLines(allLines);
  } catch (error) {
    console.error("[parsePDF] Error:", error);
    return {
      success: false,
      transactions: [],
      error: "Eroare la citirea PDF-ului. Asigură-te că fișierul este un extras BT valid.",
    };
  }
}

/**
 * Parser logic pentru liniile extrase din PDF-ul BT
 */
function parseBTLines(lines: string[]): ParseResult {
  const transactions: ParsedTransaction[] = [];

  // Rânduri de ignorat — rezumate zilnice și solduri
  const SKIP_PATTERNS = [
    /^RULAJ ZI/i,
    /^SOLD FINAL ZI/i,
    /^SOLD ANTERIOR/i,
    /^RULAJ TOTAL CONT/i,
    /^SOLD FINAL CONT/i,
    /^TOTAL DISPONIBIL/i,
    /^Fonduri proprii/i,
    /^Credit neutilizat/i,
    /^Data\s+Descriere/i,
    /^BANCA TRANSILVANIA/i,
    /^Info clienti/i,
    /^Solicitant/i,
    /^Tiparit/i,
    /^\d+\s*\/\s*\d+$/,   // "1 / 7" — număr pagină
    /^REF:/i,
  ];

  // Regex dată BT: DD/MM/YYYY
  const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

  // Regex sumă: număr cu virgulă opțională și 2 zecimale (ex: 1,240.00 sau 120.00)
  const AMOUNT_RE = /^[\d,]+\.\d{2}$/;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip linii goale sau de ignorat
    if (!line || SKIP_PATTERNS.some((p) => p.test(line))) {
      i++;
      continue;
    }

    const dateMatch = line.match(DATE_RE);
    if (!dateMatch) {
      i++;
      continue;
    }

    // Găsit o dată — colectăm liniile de descriere până la suma Debit/Credit
    const [, day, month, year] = dateMatch;
    const isoDate = `${year}-${month}-${day}`;

    const descLines: string[] = [];
    let debit: number | null = null;
    let credit: number | null = null;
    let j = i + 1;

    while (j < lines.length) {
      const nextLine = lines[j].trim();
      if (!nextLine) { j++; continue; }

      // Dacă găsim o nouă dată — stop
      if (DATE_RE.test(nextLine)) break;

      // Dacă e un pattern de skip — stop
      if (SKIP_PATTERNS.some((p) => p.test(nextLine))) break;

      // Verificăm dacă linia e o sumă
      if (AMOUNT_RE.test(nextLine)) {
        const val = parseFloat(nextLine.replace(/,/g, ""));
        if (!isNaN(val) && val > 0) {
          // Prima sumă = Debit, a doua = Credit (ordinea coloanelor BT)
          if (debit === null) {
            debit = val;
          } else {
            credit = val;
          }
        }
        j++;
        continue;
      }

      // Altfel e descriere
      if (!SKIP_PATTERNS.some((p) => p.test(nextLine))) {
        descLines.push(nextLine);
      }
      j++;
    }

    // Construim tranzacția dacă avem cel puțin o sumă
    if (debit !== null || credit !== null) {
      const description = descLines
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (description.length > 0) {
        if (debit !== null && debit > 0) {
          transactions.push({
            date: isoDate,
            description,
            amount: -debit,   // Debit = cheltuială → negativ
            currency: "RON",
            type: "debit",
          });
        }
        if (credit !== null && credit > 0) {
          transactions.push({
            date: isoDate,
            description,
            amount: credit,   // Credit = venit → pozitiv
            currency: "RON",
            type: "credit",
          });
        }
      }
    }

    i = j;
  }

  if (transactions.length === 0) {
    return {
      success: false,
      transactions: [],
      error: "Nu s-au putut extrage tranzacții din PDF. Asigură-te că este un extras Banca Transilvania.",
    };
  }

  return { success: true, transactions, rowCount: transactions.length };
}

/**
 * FUNCȚII HELPER - Detectare automată coloane
 *
 * Aceste funcții încearcă să ghicească care coloană conține ce informație.
 * Funcționează cu diverse formate de extrase bancare.
 */

function detectDate(row: any): string | null {
  // Căutăm o coloană care arată ca o dată
  // Adăugăm "completed" pentru Revolut (Completed Date)
  // Adăugăm "început" pentru Revolut România (Data de început)
  // NOTĂ: Excel exportă "Ä" în loc de "Ă" pentru caracterele românești
  // RUSSIAN: "Дата начала", "Дата выполнения" (Start Date, Completion Date)
  const dateKeys = [
    "completed", "data", "date", "început", "inceput", "änceput", "start",
    "data operatiunii", "data tranzactiei",
    "дата", "дата начала", "дата выполнения", // Russian: date, start date, completion date
  ];

  for (const key of Object.keys(row)) {
    const normalizedKey = key.toLowerCase().trim();
    if (dateKeys.some((k) => normalizedKey.includes(k))) {
      const dateValue = row[key];
      console.log('[detectDate] Found date column:', key, '→', JSON.stringify(dateValue));
      return dateValue;
    }
  }

  // Dacă nu găsim, luăm prima coloană care arată ca o dată
  for (const value of Object.values(row)) {
    if (typeof value === "string" && isDate(value)) {
      console.log('[detectDate] Found date by pattern:', JSON.stringify(value));
      return value;
    }
  }

  console.warn('[detectDate] No date found in row:', row);
  return null;
}

function detectDescription(row: any): string | null {
  // Adăugăm variante cu diacritice pentru Revolut România
  // RUSSIAN: "Описание" (Description)
  const descKeys = [
    "descriere", "description", "detalii", "details", "beneficiar",
    "описание", // Russian: description
  ];

  for (const key of Object.keys(row)) {
    const normalizedKey = key.toLowerCase().trim();
    if (descKeys.some((k) => normalizedKey.includes(k))) {
      console.log('[detectDescription] Found description column:', key, '→', row[key]);
      return row[key];
    }
  }

  console.warn('[detectDescription] No description found in row:', Object.keys(row));
  return null;
}

function detectAmount(row: any): string | null {
  // Adăugăm "sumă" cu diacritice pentru Revolut România
  // NOTĂ: Excel exportă "SumÄ" (Ä = A-umlaut) în loc de "Sumă" (Ă = A-breve)
  // RUSSIAN: "Сумма" (Amount)
  const amountKeys = [
    "sumă", "sumä", "suma", "amount", "valoare", "value", "total",
    "сумма", // Russian: amount
  ];

  // Căutăm o coloană cu suma
  for (const key of Object.keys(row)) {
    // Normalizăm: lowercase + trim spații invizibile
    const normalizedKey = key.toLowerCase().trim();

    // DEBUG: Verificăm fiecare cheie
    const matches = amountKeys.filter(k => normalizedKey.includes(k));
    if (matches.length > 0) {
      console.log('[detectAmount] ✅ MATCH! Key:', `"${key}"`, '→ normalized:', `"${normalizedKey}"`, '→ matched:', matches);
      return row[key];
    }
  }

  // Dacă nu găsim, verificăm dacă există coloane separate Debit/Credit (format ING)
  const debitKeys = ["debit"];
  const creditKeys = ["credit"];

  let debitValue: string | null = null;
  let creditValue: string | null = null;

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase();
    if (debitKeys.some((k) => lowerKey.includes(k))) {
      debitValue = row[key];
    }
    if (creditKeys.some((k) => lowerKey.includes(k))) {
      creditValue = row[key];
    }
  }

  // Dacă avem Debit/Credit, returnăm valoarea care nu e goală
  // Debit = negativ (cheltuială), Credit = pozitiv (venit)
  if (debitValue && debitValue.trim() !== "") {
    console.log('[detectAmount] Found debit value:', debitValue);
    return `-${debitValue}`;
  }
  if (creditValue && creditValue.trim() !== "") {
    console.log('[detectAmount] Found credit value:', creditValue);
    return creditValue;
  }

  console.warn('[detectAmount] No amount found in row:', Object.keys(row));
  return null;
}

function detectCurrency(row: any): string | null {
  // RUSSIAN: "Валюта" (Currency)
  const currencyKeys = [
    "moneda", "currency", "valuta",
    "валюта", // Russian: currency
  ];

  for (const key of Object.keys(row)) {
    const lowerKey = key.toLowerCase().trim();
    if (currencyKeys.some((k) => lowerKey.includes(k))) {
      return row[key];
    }
  }

  return null;
}

/**
 * Verifică dacă un string arată ca o dată
 */
function isDate(str: string): boolean {
  // Formate acceptate:
  // - DD.MM.YYYY, DD/MM/YYYY (Romanian)
  // - YYYY-MM-DD HH:MM:SS (Russian)
  // - YYYY-MM-DD HH:MM (ISO with timestamp)
  // - YYYY-MM-DD (ISO)
  const dateRegex = /^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$|^\d{4}-\d{2}-\d{2}(\s\d{2}:\d{2}(:\d{2})?)?$/;
  return dateRegex.test(str);
}

/**
 * Convertește Excel serial number în dată
 * Excel stochează datele ca număr de zile de la 1 ianuarie 1900
 */
function excelSerialToDate(serial: number): string {
  // Excel epoch: 1 ianuarie 1900 (cu bug: consideră 1900 an bisect)
  const excelEpoch = new Date(1900, 0, 1);
  const days = Math.floor(serial) - 2; // -2 pentru bug-ul Excel 1900
  const milliseconds = days * 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch.getTime() + milliseconds);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatează data în format ISO (YYYY-MM-DD)
 */
function formatDate(dateStr: string | number): string {
  // DEBUG: Log intrare
  console.log('[formatDate] Input:', JSON.stringify(dateStr), 'Type:', typeof dateStr);

  // Verificăm dacă e Excel serial number (number sau string ce pare număr > 40000)
  const asNumber = typeof dateStr === 'number' ? dateStr : parseFloat(String(dateStr));
  if (!isNaN(asNumber) && asNumber > 40000 && asNumber < 60000) {
    console.log('[formatDate] Excel serial number detected:', asNumber);
    const result = excelSerialToDate(asNumber);
    console.log('[formatDate] Converted to date:', result);
    return result;
  }

  // Dacă e number dar nu e Excel serial, e invalid
  if (typeof dateStr === 'number') {
    console.warn('[formatDate] Invalid number (not Excel serial):', dateStr);
    return new Date().toISOString().split("T")[0];
  }

  // Validare: dacă nu primim string valid, returnăm data curentă
  if (!dateStr || typeof dateStr !== 'string') {
    console.warn('[formatDate] Invalid date string:', dateStr);
    return new Date().toISOString().split("T")[0];
  }

  // Curățăm string-ul (trim whitespace)
  const cleanStr = dateStr.trim();
  console.log('[formatDate] After trim:', JSON.stringify(cleanStr));

  // Dacă e deja ISO format (cu sau fără timestamp)
  // Ex: "2025-12-02 08:57:52" (Russian) sau "2025-12-02" (ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    // Extragem doar partea de dată (fără timestamp: " 08:57:52" sau "T08:57:52")
    const result = cleanStr.split(" ")[0].split("T")[0];
    console.log('[formatDate] ISO format detected. Result:', result);
    return result;
  }

  // Format Revolut: DD MMM YYYY (ex: "01 Dec 2024")
  const revolutPattern = /^(\d{2})\s+(\w{3})\s+(\d{4})$/;
  const revolutMatch = cleanStr.match(revolutPattern);

  if (revolutMatch) {
    const monthMap: { [key: string]: string } = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };

    const day = revolutMatch[1];
    const monthName = revolutMatch[2];
    const year = revolutMatch[3];
    const month = monthMap[monthName];

    if (month) {
      const result = `${year}-${month}-${day}`;
      console.log('[formatDate] Revolut format detected. Result:', result);
      return result;
    }
  }

  // Parsăm formate românești: DD.MM.YYYY sau DD/MM/YYYY
  const parts = cleanStr.split(/[./-]/);
  console.log('[formatDate] Parsed parts:', parts);

  if (parts.length === 3) {
    const [day, month, year] = parts;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const result = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    console.log('[formatDate] Romanian format detected. Result:', result);
    return result;
  }

  // Fallback: returnăm data curentă (cu warning)
  console.warn('[formatDate] Could not parse date, using current date:', dateStr);
  return new Date().toISOString().split("T")[0];
}
