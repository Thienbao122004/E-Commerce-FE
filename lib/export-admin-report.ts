"use client"

import type { GenerateReportResponse } from "@/services/ai-admin"

export type AdminReportExportMeta = {
  reportLabel: string
  additionalContext?: string
}

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.rel = "noopener"
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function buildFilename(reportType: string, fromDate: string, toDate: string, ext: string) {
  const safe = (s: string) => s.replace(/[^\dA-Za-z-]+/g, "_")
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  return `bao-cao-${safe(reportType)}_${fromDate}_${toDate}_${ts}.${ext}`
}

function bulletSection(title: string, items: string[]) {
  const empty = `_Kh\u00f4ng c\u00f3._`
  if (!items?.length) return `## ${title}\n\n${empty}\n\n`
  return `## ${title}\n\n${items.map((l) => `- ${l.replace(/\r?\n/g, " ")}`).join("\n")}\n\n`
}

export function buildAdminReportMarkdown(
  data: GenerateReportResponse,
  meta: AdminReportExportMeta,
): string {
  const statsJson = JSON.stringify(data.statistics, null, 2)
  const ctxHeading = `## Ghi ch\u00fa y\u00eau c\u1ea7u`
  const ctx =
    meta.additionalContext?.trim() &&
    `${ctxHeading}\n\n${meta.additionalContext.trim()}\n\n`

  const rangeLine =
    `- **Kho\u1ea3ng th\u1eddi gian:** ${data.fromDate} \u2192 ${data.toDate}`

  return [
    `# B\u00e1o c\u00e1o: ${meta.reportLabel}`,
    "",
    `- **Lo\u1ea1i (m\u00e3):** ${data.reportType}`,
    rangeLine,
    `- **T\u1ea1o l\u00fac (UTC):** ${data.generatedAt}`,
    "",
    ctx || "",
    "## Ph\u00e2n t\u00edch AI",
    "",
    data.aiInsights?.trim() || `_Kh\u00f4ng c\u00f3._`,
    "",
    "",
    bulletSection("Ph\u00e1t hi\u1ec7n ch\u00ednh", data.keyFindings),
    bulletSection("\u0110\u1ec1 xu\u1ea5t", data.recommendations),
    "## D\u1eef li\u1ec7u th\u1ed1ng k\u00ea (RAW)",
    "",
    "```json",
    statsJson,
    "```",
    "",
  ].join("\n")
}

export function buildAdminReportJson(
  data: GenerateReportResponse,
  meta: AdminReportExportMeta,
): string {
  const payload = {
    exportedAt: new Date().toISOString(),
    reportLabel: meta.reportLabel,
    additionalContext: meta.additionalContext?.trim() || null,
    ...data,
  }
  return JSON.stringify(payload, null, 2)
}

function csvEscapeCell(s: string): string {
  const t = s.replace(/\r\n/g, "\n")
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

function flattenStatisticsRows(statistics: unknown): Array<[string, string]> {
  const rows: Array<[string, string]> = []

  const walk = (val: unknown, path: string) => {
    if (val === null || val === undefined) {
      rows.push([path || "value", ""])
      return
    }
    const t = typeof val
    if (t === "string" || t === "number" || t === "boolean") {
      rows.push([path || "value", String(val)])
      return
    }
    if (Array.isArray(val)) {
      if (val.length === 0) {
        rows.push([path || "[]", ""])
        return
      }
      val.forEach((item, i) => {
        const p = path ? `${path}[${i}]` : `[${i}]`
        if (item !== null && typeof item === "object") walk(item, p)
        else walk(item, p)
      })
      return
    }
    if (t === "object") {
      const o = val as Record<string, unknown>
      const keys = Object.keys(o)
      if (keys.length === 0) {
        rows.push([path || "{}", "{}"])
        return
      }
      for (const k of keys) {
        const p = path ? `${path}.${k}` : k
        const v = o[k]
        if (v !== null && typeof v === "object" && !Array.isArray(v)) walk(v, p)
        else if (Array.isArray(v)) rows.push([p, JSON.stringify(v)])
        else walk(v, p)
      }
    }
  }

  walk(statistics, "")
  return rows
}

export function buildAdminReportCsv(data: GenerateReportResponse, meta: AdminReportExportMeta): string {
  const lines: string[] = []
  const pair = (a: string, b: string) => lines.push(`${csvEscapeCell(a)},${csvEscapeCell(b)}`)

  lines.push(csvEscapeCell("Mục"), csvEscapeCell("Giá trị"))
  pair("Tên báo cáo", meta.reportLabel)
  pair("Loại (mã)", data.reportType)
  pair("T\u1eeb ng\u00e0y", data.fromDate)
  pair("Đến ngày", data.toDate)
  pair("Tạo lúc (UTC)", data.generatedAt)
  if (meta.additionalContext?.trim()) pair("Ghi chú yêu cầu", meta.additionalContext.trim())

  lines.push("", csvEscapeCell("Phân tích AI"), "")
  lines.push(csvEscapeCell(data.aiInsights?.trim() || "Không có."))

  lines.push("", csvEscapeCell("Phát hiện chính"), "")
  if (data.keyFindings?.length) {
    lines.push(csvEscapeCell("STT"), csvEscapeCell("Nội dung"))
    data.keyFindings.forEach((t, i) => lines.push(csvEscapeCell(String(i + 1)), csvEscapeCell(t)))
  } else {
    lines.push(csvEscapeCell("—"), csvEscapeCell("Không có."))
  }

  lines.push("", csvEscapeCell("Đề xuất"), "")
  if (data.recommendations?.length) {
    lines.push(csvEscapeCell("STT"), csvEscapeCell("Nội dung"))
    data.recommendations.forEach((t, i) => lines.push(csvEscapeCell(String(i + 1)), csvEscapeCell(t)))
  } else {
    lines.push(csvEscapeCell("—"), csvEscapeCell("Không có."))
  }

  lines.push("", csvEscapeCell("Thống kê (khóa)"), csvEscapeCell("Giá trị"))
  const flat = flattenStatisticsRows(data.statistics)
  if (flat.length) {
    for (const [k, v] of flat) lines.push(csvEscapeCell(k), csvEscapeCell(v))
  } else {
    lines.push(csvEscapeCell("—"), csvEscapeCell(""))
  }

  return "\uFEFF" + lines.join("\r\n")
}

export function downloadAdminReportCsv(data: GenerateReportResponse, meta: AdminReportExportMeta) {
  const body = buildAdminReportCsv(data, meta)
  const name = buildFilename(data.reportType, data.fromDate, data.toDate, "csv")
  triggerDownload(body, name, "text/csv")
}

export async function downloadAdminReportExcel(
  data: GenerateReportResponse,
  meta: AdminReportExportMeta,
): Promise<void> {
  const ExcelJS = await import("exceljs")
  const wb = new ExcelJS.Workbook()
  wb.creator = "eCAP Admin"
  wb.created = new Date()

  // ── Colour palette ────────────────────────────────────────────────────────
  const BLUE_DARK = "1E3A5F"
  const BLUE_MID = "2563EB"
  const BLUE_LIGHT = "DBEAFE"
  const GRAY_LIGHT = "F8FAFC"
  const BORDER_COLOR = "CBD5E1"
  const WHITE = "FFFFFF"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type XRow = any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type XFill = any

  const thinBorder = {
    top: { style: "thin" as const, color: { argb: BORDER_COLOR } },
    left: { style: "thin" as const, color: { argb: BORDER_COLOR } },
    bottom: { style: "thin" as const, color: { argb: BORDER_COLOR } },
    right: { style: "thin" as const, color: { argb: BORDER_COLOR } },
  }

  const headerFill = (argb: string): XFill => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb },
  })

  const applyHeaderRow = (row: XRow, bgArgb: string) => {
    row.font = { bold: true, color: { argb: WHITE }, size: 11 }
    row.fill = headerFill(bgArgb)
    row.alignment = { vertical: "middle", wrapText: true }
    row.border = thinBorder
    row.height = 22
  }

  const applyDataRow = (row: XRow, even: boolean) => {
    row.fill = headerFill(even ? GRAY_LIGHT : WHITE)
    row.alignment = { vertical: "top", wrapText: true }
    row.border = thinBorder
    row.height = 18
  }

  // ── Sheet 1: Tổng hợp ────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Tong hop")
  ws1.columns = [{ width: 26 }, { width: 64 }]

  // Title block
  ws1.mergeCells("A1:B1")
  const titleCell = ws1.getCell("A1")
  titleCell.value = `\u0042\u00e1o c\u00e1o: ${meta.reportLabel}`
  titleCell.font = { bold: true, size: 15, color: { argb: BLUE_DARK } }
  titleCell.fill = headerFill(BLUE_LIGHT)
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  titleCell.border = thinBorder
  ws1.getRow(1).height = 30

  ws1.addRow([])

  const metaHeader = ws1.addRow(["\u0054r\u01b0\u1eddng", "Gi\u00e1 tr\u1ecb"])
  applyHeaderRow(metaHeader, BLUE_DARK)

  const metaData: [string, string][] = [
    ["\u0054\u00ean b\u00e1o c\u00e1o", meta.reportLabel],
    ["\u004co\u1ea1i (m\u00e3)", data.reportType],
    ["\u004bho\u1ea3ng th\u1eddi gian", `${data.fromDate} \u2192 ${data.toDate}`],
    ["\u0054\u1ea1o l\u00fac (UTC)", data.generatedAt],
    ...(meta.additionalContext?.trim()
      ? [["\u0047hi ch\u00fa y\u00eau c\u1ea7u", meta.additionalContext.trim()] as [string, string]]
      : []),
  ]
  metaData.forEach(([k, v], i) => {
    const r = ws1.addRow([k, v])
    r.getCell(1).font = { bold: true, color: { argb: BLUE_DARK } }
    applyDataRow(r, i % 2 === 0)
  })

  // ── Sheet 2: Phân tích AI ─────────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Phan tich AI")
  ws2.columns = [{ width: 16 }, { width: 90 }]

  ws2.mergeCells("A1:B1")
  const aiTitle = ws2.getCell("A1")
  aiTitle.value = "\u0050h\u00e2n t\u00edch AI"
  aiTitle.font = { bold: true, size: 13, color: { argb: WHITE } }
  aiTitle.fill = headerFill(BLUE_MID)
  aiTitle.alignment = { vertical: "middle", horizontal: "left", indent: 1 }
  aiTitle.border = thinBorder
  ws2.getRow(1).height = 26

  ws2.addRow([])

  const aiCell = ws2.getCell("A3")
  ws2.mergeCells("A3:B3")
  aiCell.value = data.aiInsights?.trim() || "\u004bh\u00f4ng c\u00f3."
  aiCell.alignment = { vertical: "top", wrapText: true }
  aiCell.border = thinBorder
  aiCell.fill = headerFill(GRAY_LIGHT)
  const aiLines = (data.aiInsights?.trim() || "").split("\n").length
  ws2.getRow(3).height = Math.max(60, aiLines * 15)

  // ── Sheet 3: Phát hiện chính ──────────────────────────────────────────────
  const ws3 = wb.addWorksheet("Phat hien chinh")
  ws3.columns = [{ width: 8 }, { width: 100 }]

  const hdr3 = ws3.addRow(["STT", "\u004e\u1ed9i dung"])
  applyHeaderRow(hdr3, BLUE_DARK)

  const findings = data.keyFindings?.length ? data.keyFindings : ["\u004bh\u00f4ng c\u00f3."]
  findings.forEach((t, i) => {
    const r = ws3.addRow([i + 1, t])
    applyDataRow(r, i % 2 === 0)
    r.getCell(1).alignment = { horizontal: "center", vertical: "top" }
    r.getCell(1).font = { bold: true, color: { argb: BLUE_MID } }
    r.height = Math.max(18, Math.ceil(t.length / 80) * 16)
  })

  // ── Sheet 4: Đề xuất ──────────────────────────────────────────────────────
  const ws4 = wb.addWorksheet("De xuat")
  ws4.columns = [{ width: 8 }, { width: 100 }]

  const hdr4 = ws4.addRow(["STT", "\u004e\u1ed9i dung"])
  applyHeaderRow(hdr4, BLUE_DARK)

  const recs = data.recommendations?.length
    ? data.recommendations
    : ["\u004bh\u00f4ng c\u00f3."]
  recs.forEach((t, i) => {
    const r = ws4.addRow([i + 1, t])
    applyDataRow(r, i % 2 === 0)
    r.getCell(1).alignment = { horizontal: "center", vertical: "top" }
    r.getCell(1).font = { bold: true, color: { argb: BLUE_MID } }
    r.height = Math.max(18, Math.ceil(t.length / 80) * 16)
  })

  // ── Sheet 5: Thống kê RAW ─────────────────────────────────────────────────
  const ws5 = wb.addWorksheet("Thong ke")
  ws5.columns = [{ width: 42 }, { width: 60 }]

  const hdr5 = ws5.addRow(["\u004bh\u00f3a", "Gi\u00e1 tr\u1ecb"])
  applyHeaderRow(hdr5, BLUE_DARK)

  const flat = flattenStatisticsRows(data.statistics)
  const statData = flat.length ? flat : [["\u2014", ""] as [string, string]]
  statData.forEach(([k, v], i) => {
    const r = ws5.addRow([k, v])
    applyDataRow(r, i % 2 === 0)
    r.getCell(1).font = { color: { argb: "475569" }, italic: true }
  })

  // ── Download ─────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const name = buildFilename(data.reportType, data.fromDate, data.toDate, "xlsx")
  triggerDownloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    name,
  )
}

// ── PDF via pdfmake (direct download, no html2canvas, Roboto supports Vietnamese) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pdfSection(title: string): any {
  return {
    text: title,
    style: "sectionHeader",
    margin: [0, 16, 0, 6],
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildPdfDocDef(data: GenerateReportResponse, meta: AdminReportExportMeta): any {
  const metaTableBody = [
    [
      { text: "\u004co\u1ea1i (m\u00e3)", style: "metaKey" },
      { text: data.reportType, style: "metaVal" },
    ],
    [
      { text: "Kho\u1ea3ng th\u1eddi gian", style: "metaKey" },
      { text: `${data.fromDate} \u2192 ${data.toDate}`, style: "metaVal" },
    ],
    [
      { text: "T\u1ea1o l\u00fac (UTC)", style: "metaKey" },
      { text: data.generatedAt, style: "metaVal" },
    ],
    ...(meta.additionalContext?.trim()
      ? [
          [
            { text: "Ghi ch\u00fa y\u00eau c\u1ea7u", style: "metaKey" },
            { text: meta.additionalContext.trim(), style: "metaVal" },
          ],
        ]
      : []),
  ]

  const toList = (arr: string[]) =>
    (arr?.length ? arr : ["\u004bh\u00f4ng c\u00f3."]).map((t) => ({ text: t, style: "listItem" }))

  return {
    pageSize: "A4",
    pageMargins: [50, 50, 50, 50],
    // pdfmake 0.3.x requires explicit font declarations in the document definition
    fonts: {
      Roboto: {
        normal: "Roboto-Regular.ttf",
        bold: "Roboto-Medium.ttf",
        italics: "Roboto-Italic.ttf",
        bolditalics: "Roboto-MediumItalic.ttf",
      },
    },
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.45, color: "#1e293b" },
    styles: {
      titleLabel: {
        fontSize: 8,
        color: "#2563eb",
        bold: true,
        letterSpacing: 1,
        margin: [0, 0, 0, 4],
      },
      title: { fontSize: 18, bold: true, color: "#0f172a", margin: [0, 2, 0, 14] },
      metaKey: { fontSize: 9.5, bold: true, color: "#475569" },
      metaVal: { fontSize: 9.5, color: "#1e293b" },
      sectionHeader: { fontSize: 12, bold: true, color: "#2563eb" },
      listItem: { fontSize: 10, color: "#1e293b", margin: [0, 1, 0, 2] },
      codeText: { fontSize: 8, color: "#334155" },
      footer: { fontSize: 8, color: "#94a3b8", italics: true },
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `${meta.reportLabel}  \u2022  Trang ${currentPage} / ${pageCount}`,
      style: "footer",
      alignment: "center",
      margin: [0, 8, 0, 0],
    }),
    content: [
      // Header stripe
      {
        canvas: [{ type: "rect", x: 0, y: 0, w: 495, h: 4, color: "#2563eb" }],
        margin: [0, 0, 0, 12],
      },
      { text: "B\u00c1O C\u00c1O", style: "titleLabel" },
      { text: meta.reportLabel, style: "title" },
      // Metadata table
      {
        table: {
          widths: [130, "*"],
          body: metaTableBody,
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#e2e8f0",
          paddingLeft: () => 0,
          paddingRight: () => 8,
          paddingTop: () => 5,
          paddingBottom: () => 5,
        },
        margin: [0, 0, 0, 14],
      },
      // Divider
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 495, y2: 0, lineWidth: 0.5, lineColor: "#e2e8f0" }] },
      // AI Analysis
      pdfSection("Ph\u00e2n t\u00edch AI"),
      {
        text: data.aiInsights?.trim() || "\u004bh\u00f4ng c\u00f3.",
        fontSize: 10,
        color: "#1e293b",
        margin: [0, 0, 0, 14],
        lineHeight: 1.6,
      },
      // Key Findings
      pdfSection("Ph\u00e1t hi\u1ec7n ch\u00ednh"),
      { ul: toList(data.keyFindings), margin: [4, 0, 0, 14] },
      // Recommendations
      pdfSection("\u0110\u1ec1 xu\u1ea5t"),
      { ul: toList(data.recommendations), margin: [4, 0, 0, 14] },
      // Raw Stats
      pdfSection("D\u1eef li\u1ec7u th\u1ed1ng k\u00ea (RAW)"),
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                text: JSON.stringify(data.statistics, null, 2),
                style: "codeText",
                preserveLeadingSpaces: true,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 10,
          paddingRight: () => 10,
          paddingTop: () => 8,
          paddingBottom: () => 8,
          fillColor: () => "#f8fafc",
        },
      },
    ],
  }
}

export async function downloadAdminReportPdf(
  data: GenerateReportResponse,
  meta: AdminReportExportMeta,
): Promise<void> {
  // pdfmake 0.3.x: load sequentially so vfs_fonts auto-registration sees the global pdfMake
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMakeRaw = (await import("pdfmake/build/pdfmake")) as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = pdfMakeRaw.default ?? pdfMakeRaw
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFontsRaw = (await import("pdfmake/build/vfs_fonts")) as any
  const pdfFonts = pdfFontsRaw.default ?? pdfFontsRaw
  // pdfmake 0.3.x dropped .vfs — must use addVirtualFileSystem()
  if (typeof pdfMake.addVirtualFileSystem === "function") {
    pdfMake.addVirtualFileSystem(pdfFonts)
  } else {
    pdfMake.vfs = pdfFonts
  }

  const docDef = buildPdfDocDef(data, meta)
  const filename = buildFilename(data.reportType, data.fromDate, data.toDate, "pdf")
  pdfMake.createPdf(docDef).download(filename)
}

export function downloadAdminReportMarkdown(
  data: GenerateReportResponse,
  meta: AdminReportExportMeta,
) {
  const body = buildAdminReportMarkdown(data, meta)
  const name = buildFilename(data.reportType, data.fromDate, data.toDate, "md")
  triggerDownload(body, name, "text/markdown")
}

export function downloadAdminReportJson(data: GenerateReportResponse, meta: AdminReportExportMeta) {
  const body = buildAdminReportJson(data, meta)
  const name = buildFilename(data.reportType, data.fromDate, data.toDate, "json")
  triggerDownload(body, name, "application/json")
}
