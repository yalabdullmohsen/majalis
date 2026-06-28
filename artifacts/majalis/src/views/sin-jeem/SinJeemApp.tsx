import { Route, Switch } from "wouter";
import { GameProvider } from "@/lib/sin-jeem/context";
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
        <Route path="/sin-jeem" component={SinJeemHomePage} />
        <Route path="/sin-jeem/setup/:mode" component={SinJeemSetupPage} />
        <Route path="/sin-jeem/play" component={SinJeemPlayPage} />
        <Route path="/sin-jeem/results" component={SinJeemResultsPage} />
        <Route path="/sin-jeem/leaderboard" component={SinJeemLeaderboardPage} />
        <Route path="/sin-jeem/tournament" component={SinJeemTournamentPage} />
      </Switch>
    </GameProvider>
  );
}
