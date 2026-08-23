const URL_REGEX = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+/gi

const NAME_PHONE_REGEX = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\s+((?:\+\d{1,3}[\s-]?)?\d{6,})/g

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  '1': { name: 'EE.UU./Canadá', flag: '🇺🇸' },
  '7': { name: 'Rusia', flag: '🇷🇺' },
  '20': { name: 'Egipto', flag: '🇪🇬' },
  '27': { name: 'Sudáfrica', flag: '🇿🇦' },
  '30': { name: 'Grecia', flag: '🇬🇷' },
  '31': { name: 'Países Bajos', flag: '🇳🇱' },
  '32': { name: 'Bélgica', flag: '🇧🇪' },
  '33': { name: 'Francia', flag: '🇫🇷' },
  '34': { name: 'España', flag: '🇪🇸' },
  '39': { name: 'Italia', flag: '🇮🇹' },
  '44': { name: 'Reino Unido', flag: '🇬🇧' },
  '49': { name: 'Alemania', flag: '🇩🇪' },
  '51': { name: 'Perú', flag: '🇵🇪' },
  '52': { name: 'México', flag: '🇲🇽' },
  '53': { name: 'Cuba', flag: '🇨🇺' },
  '54': { name: 'Argentina', flag: '🇦🇷' },
  '55': { name: 'Brasil', flag: '🇧🇷' },
  '56': { name: 'Chile', flag: '🇨🇱' },
  '57': { name: 'Colombia', flag: '🇨🇴' },
  '58': { name: 'Venezuela', flag: '🇻🇪' },
  '61': { name: 'Australia', flag: '🇦🇺' },
  '62': { name: 'Indonesia', flag: '🇮🇩' },
  '63': { name: 'Filipinas', flag: '🇵🇭' },
  '64': { name: 'Nueva Zelanda', flag: '🇳🇿' },
  '65': { name: 'Singapur', flag: '🇸🇬' },
  '66': { name: 'Tailandia', flag: '🇹🇭' },
  '81': { name: 'Japón', flag: '🇯🇵' },
  '82': { name: 'Corea del Sur', flag: '🇰🇷' },
  '84': { name: 'Vietnam', flag: '🇻🇳' },
  '86': { name: 'China', flag: '🇨🇳' },
  '90': { name: 'Turquía', flag: '🇹🇷' },
  '91': { name: 'India', flag: '🇮🇳' },
  '212': { name: 'Marruecos', flag: '🇲🇦' },
  '213': { name: 'Argelia', flag: '🇩🇿' },
  '216': { name: 'Túnez', flag: '🇹🇳' },
  '220': { name: 'Gambia', flag: '🇬🇲' },
  '221': { name: 'Senegal', flag: '🇸🇳' },
  '224': { name: 'Guinea', flag: '🇬🇳' },
  '225': { name: 'Costa de Marfil', flag: '🇨🇮' },
  '226': { name: 'Burkina Faso', flag: '🇧🇫' },
  '227': { name: 'Níger', flag: '🇳🇪' },
  '229': { name: 'Benín', flag: '🇧🇯' },
  '230': { name: 'Mauricio', flag: '🇲🇺' },
  '233': { name: 'Ghana', flag: '🇬🇭' },
  '234': { name: 'Nigeria', flag: '🇳🇬' },
  '236': { name: 'República Centroafricana', flag: '🇨🇫' },
  '237': { name: 'Camerún', flag: '🇨🇲' },
  '238': { name: 'Cabo Verde', flag: '🇨🇻' },
  '239': { name: 'Santo Tomé y Príncipe', flag: '🇸🇹' },
  '240': { name: 'Guinea Ecuatorial', flag: '🇬🇶' },
  '241': { name: 'Gabón', flag: '🇬🇦' },
  '242': { name: 'Congo', flag: '🇨🇬' },
  '243': { name: 'R.D. Congo', flag: '🇨🇩' },
  '244': { name: 'Angola', flag: '🇦🇴' },
  '245': { name: 'Guinea-Bisáu', flag: '🇬🇼' },
  '248': { name: 'Seychelles', flag: '🇸🇨' },
  '249': { name: 'Sudán', flag: '🇸🇩' },
  '250': { name: 'Ruanda', flag: '🇷🇼' },
  '251': { name: 'Etiopía', flag: '🇪🇹' },
  '252': { name: 'Somalia', flag: '🇸🇴' },
  '253': { name: 'Yibuti', flag: '🇩🇯' },
  '254': { name: 'Kenia', flag: '🇰🇪' },
  '255': { name: 'Tanzania', flag: '🇹🇿' },
  '256': { name: 'Uganda', flag: '🇺🇬' },
  '257': { name: 'Burundi', flag: '🇧🇮' },
  '258': { name: 'Mozambique', flag: '🇲🇿' },
  '260': { name: 'Zambia', flag: '🇿🇲' },
  '261': { name: 'Madagascar', flag: '🇲🇬' },
  '263': { name: 'Zimbabue', flag: '🇿🇼' },
  '264': { name: 'Namibia', flag: '🇳🇦' },
  '265': { name: 'Malaui', flag: '🇲🇼' },
  '266': { name: 'Lesoto', flag: '🇱🇸' },
  '267': { name: 'Botsuana', flag: '🇧🇼' },
  '268': { name: 'Suazilandia', flag: '🇸🇿' },
  '269': { name: 'Comoras', flag: '🇰🇲' },
  '290': { name: 'Santa Elena', flag: '🇸🇭' },
  '291': { name: 'Eritrea', flag: '🇪🇷' },
  '297': { name: 'Aruba', flag: '🇦🇼' },
  '298': { name: 'Islas Feroe', flag: '🇫🇴' },
  '299': { name: 'Groenlandia', flag: '🇬🇱' },
  '350': { name: 'Gibraltar', flag: '🇬🇮' },
  '351': { name: 'Portugal', flag: '🇵🇹' },
  '352': { name: 'Luxemburgo', flag: '🇱🇺' },
  '353': { name: 'Irlanda', flag: '🇮🇪' },
  '354': { name: 'Islandia', flag: '🇮🇸' },
  '355': { name: 'Albania', flag: '🇦🇱' },
  '356': { name: 'Malta', flag: '🇲🇹' },
  '357': { name: 'Chipre', flag: '🇨🇾' },
  '358': { name: 'Finlandia', flag: '🇫🇮' },
  '359': { name: 'Bulgaria', flag: '🇧🇬' },
  '370': { name: 'Lituania', flag: '🇱🇹' },
  '371': { name: 'Letonia', flag: '🇱🇻' },
  '372': { name: 'Estonia', flag: '🇪🇪' },
  '373': { name: 'Moldavia', flag: '🇲🇩' },
  '374': { name: 'Armenia', flag: '🇦🇲' },
  '375': { name: 'Bielorrusia', flag: '🇧🇾' },
  '376': { name: 'Andorra', flag: '🇦🇩' },
  '377': { name: 'Mónaco', flag: '🇲🇨' },
  '378': { name: 'San Marino', flag: '🇸🇲' },
  '380': { name: 'Ucrania', flag: '🇺🇦' },
  '381': { name: 'Serbia', flag: '🇷🇸' },
  '382': { name: 'Montenegro', flag: '🇲🇪' },
  '385': { name: 'Croacia', flag: '🇭🇷' },
  '386': { name: 'Eslovenia', flag: '🇸🇮' },
  '387': { name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
  '389': { name: 'Macedonia del Norte', flag: '🇲🇰' },
  '420': { name: 'República Checa', flag: '🇨🇿' },
  '421': { name: 'Eslovaquia', flag: '🇸🇰' },
  '423': { name: 'Liechtenstein', flag: '🇱🇮' },
  '500': { name: 'Islas Malvinas', flag: '🇫🇰' },
  '501': { name: 'Belice', flag: '🇧🇿' },
  '502': { name: 'Guatemala', flag: '🇬🇹' },
  '503': { name: 'El Salvador', flag: '🇸🇻' },
  '504': { name: 'Honduras', flag: '🇭🇳' },
  '505': { name: 'Nicaragua', flag: '🇳🇮' },
  '506': { name: 'Costa Rica', flag: '🇨🇷' },
  '507': { name: 'Panamá', flag: '🇵🇦' },
  '508': { name: 'San Pedro y Miquelón', flag: '🇵🇲' },
  '509': { name: 'Haití', flag: '🇭🇹' },
  '590': { name: 'Guadalupe', flag: '🇬🇵' },
  '591': { name: 'Bolivia', flag: '🇧🇴' },
  '592': { name: 'Guyana', flag: '🇬🇾' },
  '593': { name: 'Ecuador', flag: '🇪🇨' },
  '594': { name: 'Guayana Francesa', flag: '🇬🇫' },
  '595': { name: 'Paraguay', flag: '🇵🇾' },
  '596': { name: 'Martinica', flag: '🇲🇶' },
  '597': { name: 'Surinam', flag: '🇸🇷' },
  '598': { name: 'Uruguay', flag: '🇺🇾' },
  '599': { name: 'Curazao', flag: '🇨🇼' },
  '670': { name: 'Timor Oriental', flag: '🇹🇱' },
  '673': { name: 'Brunéi', flag: '🇧🇳' },
  '674': { name: 'Nauru', flag: '🇳🇷' },
  '675': { name: 'Papúa Nueva Guinea', flag: '🇵🇬' },
  '676': { name: 'Tonga', flag: '🇹🇴' },
  '677': { name: 'Islas Salomón', flag: '🇸🇧' },
  '678': { name: 'Vanuatu', flag: '🇻🇺' },
  '679': { name: 'Fiyi', flag: '🇫🇯' },
  '680': { name: 'Palaos', flag: '🇵🇼' },
  '681': { name: 'Wallis y Futuna', flag: '🇼🇫' },
  '682': { name: 'Islas Cook', flag: '🇨🇰' },
  '683': { name: 'Niue', flag: '🇳🇺' },
  '684': { name: 'Samoa Americana', flag: '🇦🇸' },
  '685': { name: 'Samoa', flag: '🇼🇸' },
  '686': { name: 'Kiribati', flag: '🇰🇮' },
  '687': { name: 'Nueva Caledonia', flag: '🇳🇨' },
  '688': { name: 'Tuvalu', flag: '🇹🇻' },
  '689': { name: 'Polinesia Francesa', flag: '🇵🇫' },
  '690': { name: 'Tokelau', flag: '🇹🇰' },
  '691': { name: 'Micronesia', flag: '🇫🇲' },
  '692': { name: 'Islas Marshall', flag: '🇲🇭' },
  '850': { name: 'Corea del Norte', flag: '🇰🇵' },
  '852': { name: 'Hong Kong', flag: '🇭🇰' },
  '853': { name: 'Macao', flag: '🇲🇴' },
  '855': { name: 'Camboya', flag: '🇰🇭' },
  '856': { name: 'Laos', flag: '🇱🇦' },
  '880': { name: 'Bangladés', flag: '🇧🇩' },
  '886': { name: 'Taiwán', flag: '🇹🇼' },
  '960': { name: 'Maldivas', flag: '🇲🇻' },
  '961': { name: 'Líbano', flag: '🇱🇧' },
  '962': { name: 'Jordania', flag: '🇯🇴' },
  '963': { name: 'Siria', flag: '🇸🇾' },
  '964': { name: 'Irak', flag: '🇮🇶' },
  '965': { name: 'Kuwait', flag: '🇰🇼' },
  '966': { name: 'Arabia Saudita', flag: '🇸🇦' },
  '967': { name: 'Yemen', flag: '🇾🇪' },
  '968': { name: 'Omán', flag: '🇴🇲' },
  '970': { name: 'Palestina', flag: '🇵🇸' },
  '971': { name: 'Emiratos Árabes Unidos', flag: '🇦🇪' },
  '972': { name: 'Israel', flag: '🇮🇱' },
  '973': { name: 'Baréin', flag: '🇧🇭' },
  '974': { name: 'Catar', flag: '🇶🇦' },
  '975': { name: 'Bután', flag: '🇧🇹' },
  '976': { name: 'Mongolia', flag: '🇲🇳' },
  '977': { name: 'Nepal', flag: '🇳🇵' },
  '992': { name: 'Tayikistán', flag: '🇹🇯' },
  '993': { name: 'Turkmenistán', flag: '🇹🇲' },
  '994': { name: 'Azerbaiyán', flag: '🇦🇿' },
  '995': { name: 'Georgia', flag: '🇬🇪' },
  '996': { name: 'Kirguistán', flag: '🇰🇬' },
  '998': { name: 'Uzbekistán', flag: '🇺🇿' },
}

export function extractLinks(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, '')
  const matches = text.match(URL_REGEX)
  return matches ? [...new Set(matches)] : []
}

export function linkifyHTML(html: string): string {
  const anchors: string[] = []
  const withoutAnchors = html.replace(/<a\b[^>]*>.*?<\/a>/gi, match => {
    anchors.push(match)
    return `\x00LINK${anchors.length - 1}\x00`
  })

  const linkified = withoutAnchors.replace(
    /(^|[\s>])((https?:\/\/[^\s<]+)|(www\.[^\s<]+))/gim,
    (match, prefix: string, url: string) => {
      const href = url.startsWith('www') ? `https://${url}` : url
      return `${prefix}<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#3b82f6;text-decoration:underline">${url}</a>`
    }
  )

  return linkified.replace(/\x00LINK(\d+)\x00/g, (_, idx) => anchors[parseInt(idx)])
}

const YT_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i

export function extractYouTubeUrls(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, '')
  const matches: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(YT_REGEX.source, 'gi')
  while ((m = re.exec(text)) !== null) {
    matches.push(m[0].startsWith('http') ? m[0] : `https://${m[0]}`)
  }
  return [...new Set(matches)]
}

export function getYouTubeVideoId(url: string): string | null {
  const match = url.match(YT_REGEX)
  return match ? match[1] : null
}

export function extractNamePhonePairs(text: string): { name: string; phone: string }[] {
  const results: { name: string; phone: string }[] = []
  const seen = new Set<string>()
  const plain = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  let match
  while ((match = NAME_PHONE_REGEX.exec(plain)) !== null) {
    const name = match[1].trim()
    const phone = match[2].trim()
    const key = `${name}:${phone}`
    if (!seen.has(key)) {
      seen.add(key)
      results.push({ name, phone })
    }
  }
  return results
}

export function getCountryInfo(phone: string): { name: string; flag: string } | null {
  const match = phone.match(/^\+(\d{1,3})/)
  if (!match) return null
  const code = match[1]
  return COUNTRY_MAP[code] ?? null
}

export function getAllDataAsJSON(): string {
  const raw = localStorage.getItem('organizer-data')
  if (!raw) return '{}'
  const data = JSON.parse(raw)
  data.exportedAt = Date.now()
  return JSON.stringify(data, null, 2)
}

export function getLinkCount(html: string): number {
  return extractLinks(html).length
}
