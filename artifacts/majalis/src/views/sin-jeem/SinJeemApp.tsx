import { Route, Switch } from "wouter";
import { GameProvider } from "@/lib/sin-jeem/context";
import { QA_BASE } from "@/lib/question-answer/routes";
import SinJeemHomePage from "./SinJeemHomePage";
import SinJeemSetupPage from "./SinJeemSetupPage";
import SinJeemPlayPage from "./SinJeemPlayPage";
import SinJeemResultsPage from "./SinJeemResultsPage";
import SinJeemLeaderboardPage from "./SinJeemLeaderboardPage";
import SinJeemTournamentPage from "./SinJeemTournamentPage";
import "@/styles/sin-jeem.css";

export default function SinJeemApp() {
  return (
    <GameProvider>
      <Switch>
        <Route path={QA_BASE} component={SinJeemHomePage} />
        <Route path={`${QA_BASE}/setup/:mode`} component={SinJeemSetupPage} />
        <Route path={`${QA_BASE}/play`} component={SinJeemPlayPage} />
        <Route path={`${QA_BASE}/results`} component={SinJeemResultsPage} />
        <Route path={`${QA_BASE}/leaderboard`} component={SinJeemLeaderboardPage} />
        <Route path={`${QA_BASE}/tournament`} component={SinJeemTournamentPage} />
      </Switch>
    </GameProvider>
  );
}
