// ISO 3166-1 alpha-2 → emoji flag
const FLAGS = {
  "Argentina":          "🇦🇷", "Australia":       "🇦🇺", "Austria":          "🇦🇹",
  "Belgium":            "🇧🇪", "Bolivia":          "🇧🇴", "Bosnia-Herzegovina":"🇧🇦",
  "Brazil":             "🇧🇷", "Canada":           "🇨🇦", "Cape Verde":        "🇨🇻",
  "Colombia":           "🇨🇴", "Costa Rica":       "🇨🇷", "Croatia":           "🇭🇷",
  "Côte d'Ivoire":      "🇨🇮", "Cuba":             "🇨🇺", "Curaçao":           "🇨🇼",
  "Czech Republic":     "🇨🇿", "DR Congo":         "🇨🇩", "Ecuador":           "🇪🇨",
  "Egypt":              "🇪🇬", "El Salvador":      "🇸🇻", "England":           "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "France":             "🇫🇷", "Germany":          "🇩🇪", "Ghana":             "🇬🇭",
  "Guatemala":          "🇬🇹", "Haiti":            "🇭🇹", "Honduras":          "🇭🇳",
  "Hungary":            "🇭🇺", "IR Iran":          "🇮🇷", "Iraq":              "🇮🇶",
  "Japan":              "🇯🇵", "Jordan":           "🇯🇴", "Korea Republic":    "🇰🇷",
  "Mexico":             "🇲🇽", "Morocco":          "🇲🇦", "Netherlands":       "🇳🇱",
  "New Zealand":        "🇳🇿", "Nigeria":          "🇳🇬", "Norway":            "🇳🇴",
  "Panama":             "🇵🇦", "Paraguay":         "🇵🇾", "Peru":              "🇵🇪",
  "Portugal":           "🇵🇹", "Qatar":            "🇶🇦", "Saudi Arabia":      "🇸🇦",
  "Scotland":           "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Senegal":          "🇸🇳", "South Africa":      "🇿🇦",
  "South Korea":        "🇰🇷", "Spain":            "🇪🇸", "Sweden":            "🇸🇪",
  "Switzerland":        "🇨🇭", "Tunisia":          "🇹🇳", "Türkiye":           "🇹🇷",
  "Turkey":             "🇹🇷", "Ukraine":          "🇺🇦", "Uruguay":           "🇺🇾",
  "USA":                "🇺🇸", "Uzbekistan":       "🇺🇿",
  "Venezuela":          "🇻🇪", "Wales":            "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Algeria":            "🇩🇿",
  "Ivory Coast":        "🇨🇮",
  "Czechia":            "🇨🇿",
  "Iran":               "🇮🇷",
  "Bosnia & Herz.":     "🇧🇦",
};

export function flag(teamName) {
  return FLAGS[teamName] ?? "🏳️";
}
