import type { ThemeConfig } from 'antd'

export const crossfitBuddyTheme: ThemeConfig = {
  token: {
    colorPrimary: '#65a30d',
    colorInfo: '#65a30d',
    colorSuccess: '#15803d',
    colorText: '#171c18',
    colorBgLayout: '#f7f7f5',
    borderRadius: 12,
    borderRadiusLG: 16,
    controlHeight: 44,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    Button: {
      fontWeight: 700,
      primaryColor: '#17200f',
    },
    Card: {
      paddingLG: 20,
    },
    Input: {
      activeBorderColor: '#65a30d',
      hoverBorderColor: '#84cc16',
    },
  },
}
