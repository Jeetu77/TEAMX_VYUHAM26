// Client-side PDF report for a simulation campaign. jsPDF is loaded on demand.
const BLUE = [37, 99, 235]
const INK = [15, 23, 42]
const MUTED = [100, 116, 139]
const STATUS_COLOR = {
  clicked: [225, 29, 72],
  reported: [5, 150, 105],
  ignored: [217, 119, 6],
  opened: [37, 99, 235],
  unread: [100, 116, 139],
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)
const fmtTime = (s) => (s ? s.slice(0, 16).replace('T', ' ') : '-')

export async function exportCampaignPdf({ campaign, targets, stats }) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, H = 297, M = 16, BOTTOM = H - 18

  const header = () => {
    doc.setFillColor(...BLUE)
    doc.rect(0, 0, W, 30, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
    doc.text('CyberSafe', M, 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    doc.text('Cyber Safe Keralam', M, 21)
    doc.setFontSize(11)
    doc.text('Phishing Simulation Report', W - M, 14, { align: 'right' })
    doc.setFontSize(9)
    doc.text('Generated ' + new Date().toLocaleString(), W - M, 21, { align: 'right' })
  }
  header()

  let y = 42
  doc.setTextColor(...INK)
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
  const titleLines = doc.splitTextToSize(campaign.name, W - 2 * M)
  doc.text(titleLines, M, y)
  y += titleLines.length * 7

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED)
  doc.text('Campaign created ' + fmtTime(campaign.created_at), M, y)
  y += 6

  const emailLines = (campaign.email_content || '').split('\n')
  const subject = (emailLines[0] || '').replace('Subject: ', '')
  const from = (emailLines[1] || '').replace('From: ', '')
  if (subject) {
    doc.setFontSize(9)
    const s = doc.splitTextToSize('Training email: ' + subject, W - 2 * M)
    doc.text(s, M, y); y += s.length * 4.5
    if (from) { doc.text('Sent as: ' + from, M, y); y += 4.5 }
  }
  y += 5

  // Stat boxes
  const boxes = [
    ['Targets', stats.total, INK],
    ['Clicked', stats.clicked, STATUS_COLOR.clicked],
    ['Reported', stats.reported, STATUS_COLOR.reported],
    ['Ignored', stats.ignored ?? 0, STATUS_COLOR.ignored],
    ['Awareness', stats.awareness_score + '%', BLUE],
  ]
  const gap = 3, bw = (W - 2 * M - gap * (boxes.length - 1)) / boxes.length
  boxes.forEach(([label, value, color], i) => {
    const x = M + i * (bw + gap)
    doc.setDrawColor(226, 232, 240); doc.setFillColor(248, 250, 252)
    doc.roundedRect(x, y, bw, 22, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(...color)
    doc.text(String(value), x + bw / 2, y + 11, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED)
    doc.text(label, x + bw / 2, y + 17.5, { align: 'center' })
  })
  y += 22 + 8

  // Awareness bar
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...INK)
  doc.text('Awareness score', M, y)
  y += 3
  doc.setFillColor(226, 232, 240); doc.roundedRect(M, y, W - 2 * M, 4, 2, 2, 'F')
  const score = stats.awareness_score
  const fill = score >= 70 ? STATUS_COLOR.reported : score >= 40 ? STATUS_COLOR.ignored : STATUS_COLOR.clicked
  if (score > 0) {
    doc.setFillColor(...fill)
    doc.roundedRect(M, y, Math.max(4, ((W - 2 * M) * score) / 100), 4, 2, 2, 'F')
  }
  y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED)
  doc.text('Reported = full credit, ignored = half credit, clicked = none.', M, y)
  y += 9

  // Table
  const colName = M + 3, colStatus = 110, colTime = 150
  const tableHeader = () => {
    doc.setFillColor(241, 245, 249)
    doc.rect(M, y, W - 2 * M, 8, 'F')
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...INK)
    doc.text('Employee', colName, y + 5.4)
    doc.text('Outcome', colStatus, y + 5.4)
    doc.text('Last update', colTime, y + 5.4)
    y += 8
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK)
  doc.text('Employee results', M, y)
  y += 4
  tableHeader()
  targets.forEach((t) => {
    if (y + 8 > BOTTOM) { doc.addPage(); y = 20; tableHeader() }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...INK)
    doc.text(doc.splitTextToSize(t.employee_name, 90)[0], colName, y + 5.4)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...(STATUS_COLOR[t.status] || MUTED))
    doc.text(cap(t.status), colStatus, y + 5.4)
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED)
    doc.text(fmtTime(t.updated_at), colTime, y + 5.4)
    doc.setDrawColor(226, 232, 240); doc.line(M, y + 8, W - M, y + 8)
    y += 8
  })
  y += 8

  // Takeaways
  const clickedNames = targets.filter(t => t.status === 'clicked').map(t => t.employee_name)
  const notes = [
    `${stats.clicked} of ${stats.total} employees clicked the phishing link; ${stats.reported} reported it.`,
    score >= 70
      ? 'Awareness is strong. Keep reinforcing the habit of reporting suspicious messages.'
      : score >= 40
        ? 'Awareness is moderate. A short refresher on checking sender domains and links is recommended.'
        : 'Awareness is low. Schedule training soon and re-run the simulation afterwards to measure improvement.',
  ]
  if (clickedNames.length) {
    const shown = clickedNames.slice(0, 8).join(', ') + (clickedNames.length > 8 ? ' and others' : '')
    notes.push('Suggested follow-up training for: ' + shown + '.')
  }
  const noteLines = notes.flatMap(n => doc.splitTextToSize('- ' + n, W - 2 * M - 2))
  const needed = 8 + noteLines.length * 4.6
  if (y + needed > BOTTOM) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...INK)
  doc.text('Key takeaways', M, y)
  y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(51, 65, 85)
  doc.text(noteLines, M, y)

  // Footer on every page
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(226, 232, 240); doc.line(M, H - 14, W - M, H - 14)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED)
    doc.text('Training simulation data. Report real phishing at cybercrime.gov.in or call 1930.', M, H - 9)
    doc.text(`Page ${i} of ${pages}`, W - M, H - 9, { align: 'right' })
  }

  const safe = campaign.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'campaign'
  doc.save(`cybersafe-${safe}-report.pdf`)
}
