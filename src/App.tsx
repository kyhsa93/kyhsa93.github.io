import Router from './routes';
import { LocaleProvider } from './lib/locale';

export default function App() {
  return (
    <LocaleProvider>
      <Router />
    </LocaleProvider>
  );
}
