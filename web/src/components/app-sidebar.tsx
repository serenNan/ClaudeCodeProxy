import * as React from "react"
import {
  BarChart3,
  Key,
  Users,
  Settings2,
  Command,
  LifeBuoy,
  Send,
  FileText,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "数据面板",
    url: "/",
    icon: BarChart3,
    isActive: true,
  },
  {
    title: "API Key管理",
    url: "/apikeys",
    icon: Key,
  },
  {
    title: "账号管理",
    url: "/accounts",
    icon: Users,
  },
  {
    title: "请求日志",
    url: "/request-logs",
    icon: FileText,
  },
  {
    title: "系统设置",
    url: "/settings",
    icon: Settings2,
  },
];

const navSecondary = [
  {
    title: "帮助支持",
    url: "#",
    icon: LifeBuoy,
  },
  {
    title: "意见反馈",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  
  const userData = {
    name: user?.username || "管理员",
    email: "admin@claude-proxy.com",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Claude Code Proxy</span>
                  <span className="truncate text-xs">管理控制台</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
