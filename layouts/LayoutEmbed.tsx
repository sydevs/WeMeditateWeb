/**
 * LayoutEmbed - Minimal passthrough layout for embed routes
 *
 * This layout is used for routes that should be embedded in iframes
 * and don't need the default sidebar/navigation.
 *
 * Unlike LayoutDefault, this just renders children directly without
 * any wrapper elements, navigation, or styling.
 */
export default function LayoutEmbed({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
