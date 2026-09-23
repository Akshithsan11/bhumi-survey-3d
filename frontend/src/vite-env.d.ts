declare module "lucide-react" {
  import * as React from "react";
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    absoluteStrokeWidth?: number;
  }
  export type LucideIcon = React.ForwardRefExoticComponent<LucideProps & React.RefAttributes<SVGSVGElement>>;
  export const Home: LucideIcon;
  export const Map: LucideIcon;
  export const LayoutDashboard: LucideIcon;
  export const Upload: LucideIcon;
  export const Shield: LucideIcon;
  export const Layers: LucideIcon;
  export const Zap: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const UserPlus: LucideIcon;
  export const Building2: LucideIcon;
  export const MapPin: LucideIcon;
  export const Cpu: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Menu: LucideIcon;
  export const X: LucideIcon;
  export const Globe: LucideIcon;
  export const Database: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Lock: LucideIcon;
  export const Mail: LucideIcon;
  export const User: LucideIcon;
}