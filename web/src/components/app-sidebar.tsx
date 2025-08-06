import * as React from "react"
import {
  BarChart3,
  Key,
  Users,
  UserCog,
  Settings2,
  Command,
  LifeBuoy,
  Send,
  FileText,
  Github,
  ExternalLink,
  DollarSign,
  User,
  Gift,
  Bell,
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

// 根据用户权限动态生成导航菜单
const generateNavMain = (hasPermission: (permission: string) => boolean, user: any) => {
  const navItems = [];

  // 数据面板 - 所有用户都可以访问
  navItems.push({
    title: "数据面板",
    url: "/",
    icon: BarChart3,
    isActive: true,
  });

  // 个人中心 - 所有用户都可以访问
  navItems.push({
    title: "个人中心",
    url: "/personal-dashboard",
    icon: User,
  });

  // API Key管理 - 所有用户都可以管理自己的API Key
  navItems.push({
    title: "API Key管理",
    url: "/apikeys",
    icon: Key,
  });

  // 账号管理 - 需要相应权限或管理员角色
  if (hasPermission('account.view') || hasPermission('account.management') || hasPermission('account:manage') || user?.roleName === 'Admin') {
    navItems.push({
      title: "账号管理",
      url: "/accounts",
      icon: Users,
    });
  }

  // 用户管理 - 需要相应权限或管理员角色
  if (hasPermission('user.view') || hasPermission('user.management') || hasPermission('user:manage') || user?.roleName === 'Admin') {
    navItems.push({
      title: "用户管理",
      url: "/users",
      icon: UserCog,
    });
  }

  // 兑换码管理 - 管理员功能
  if (user?.roleName === 'Admin') {
    navItems.push({
      title: "兑换码管理",
      url: "/redeem-codes",
      icon: Gift,
    });
  }

  // 价格管理 - 需要系统设置权限或管理员角色
  if (hasPermission('system.settings') || hasPermission('pricing:manage') || user?.roleName === 'Admin') {
    navItems.push({
      title: "价格管理",
      url: "/pricing",
      icon: DollarSign,
    });
  }

  // 请求日志 - 所有用户都可以查看自己的请求日志
  navItems.push({
    title: "请求日志",
    url: "/request-logs",
    icon: FileText,
  });

  // 公告管理 - 管理员功能
  if (user?.roleName === 'Admin') {
    navItems.push({
      title: "公告管理",
      url: "/announcements",
      icon: Bell,
    });
  }

  // 系统设置 - 需要系统设置权限或管理员角色
  if (hasPermission('system.settings') || hasPermission('system:config') || user?.roleName === 'Admin') {
    navItems.push({
      title: "系统设置",
      url: "/settings",
      icon: Settings2,
    });
  }

  return navItems;
};

const navSecondary = [
  {
    title: "邀请好友",
    url: "/invite-friends",
    icon: LifeBuoy,
  },
  {
    title: "意见反馈",
    url: "#",
    icon: Send,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, hasPermission } = useAuth();
  
  const userData = {
    name: user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user?.username || "管理员",
    email: user?.email || "admin@claude-proxy.com",
    avatar: user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  };

  const navMain = generateNavMain(hasPermission, user);

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
        {/* GitHub 链接 */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a 
                href="https://github.com/AIDotNet/ClaudeCodeProxy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:bg-accent transition-colors"
              >
                <Github className="size-4" />
                <span className="flex-1">GitHub 仓库</span>
                <ExternalLink className="size-3 opacity-50" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
