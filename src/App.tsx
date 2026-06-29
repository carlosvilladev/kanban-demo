/**
 * Root composition for the kanban-board feature.
 *
 * Note: demo-auth will wrap this with an AuthProvider + login gate.
 * Note: persistence-seed will wrap BoardProvider with an initialState loader
 *       and render a <PersistenceSyncer> child inside BoardProvider.
 */
import { BoardProvider } from './board/BoardContext';
import { Board } from './components/Board';

export default function App() {
  return (
    <BoardProvider>
      <Board />
    </BoardProvider>
  );
}
