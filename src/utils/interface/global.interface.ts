export interface AuthRoutersArrayInterface {
  label: string;
  path: string;
  module: React.ReactElement | null;
  subModule: AuthRoutersArrayInterface[];
}
