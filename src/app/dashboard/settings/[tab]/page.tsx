import { SettingsPage } from "@/components/settings-page"
import { notFound } from "next/navigation"

interface SettingsTabPageProps {
  params: Promise<{
    tab: string
  }>
}

const validTabs = ['profile', 'api-keys', 'notifications', 'preferences']

export default async function SettingsTabPage({ params }: SettingsTabPageProps) {
  const { tab } = await params
  
  if (!validTabs.includes(tab)) {
    notFound()
  }
  
  return <SettingsPage activeTab={tab} />
}
