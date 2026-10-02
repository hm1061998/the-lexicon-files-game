import { useState } from 'react';
import type { NotebookPerson } from './selectNotebookPeople';
import {
  RecordedStatements,
  type InvestigationLearningProps,
} from '../investigation/RecordedStatements';
import { InvestigationArtwork } from '../investigation/InvestigationArtwork';
export interface NotebookPeoplePanelProps extends InvestigationLearningProps {
  people: readonly NotebookPerson[];
  artworkByNpcId?: Readonly<Record<string, string | undefined>>;
}
export function NotebookPeoplePanel({
  people,
  artworkByNpcId = {},
  ...learning
}: NotebookPeoplePanelProps): JSX.Element {
  const [selectedId, setSelectedId] = useState<string>();
  const selected = people.find((p) => p.npc.id === selectedId) ?? people[0];
  const { strings } = learning;
  if (!selected) return <p className="notebook-empty">{strings.notebookEmptyPeople}</p>;
  const status = (person: NotebookPerson) =>
    person.status === 'complete'
      ? strings.notebookInterviewComplete
      : strings.notebookInterviewInProgress;
  return (
    <div className="notebook-spread">
      <section className="notebook-index" aria-label={strings.notebookPeopleHeading}>
        <h3>{strings.notebookPeopleHeading}</h3>
        <ul className="notebook-people-list">
          {people.map((person) => (
            <li key={person.npc.id}>
              <button
                type="button"
                aria-label={person.npc.name}
                aria-pressed={person.npc.id === selected.npc.id}
                onClick={() => setSelectedId(person.npc.id)}
              >
                <InvestigationArtwork
                  url={artworkByNpcId[person.npc.id]}
                  name={person.npc.name}
                  portrait
                />
                <span>
                  <strong>{person.npc.name}</strong>
                  <span>{person.npc.role}</span>
                  <small>{status(person)}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <article className="notebook-detail notebook-person" aria-label={selected.npc.name}>
        <header className="notebook-person-profile">
          <InvestigationArtwork
            url={artworkByNpcId[selected.npc.id]}
            name={selected.npc.name}
            portrait
          />
          <div>
            <h3>{selected.npc.name}</h3>
            <p>{selected.npc.role}</p>
            <p className="notebook-person-status">{status(selected)}</p>
          </div>
        </header>
        <RecordedStatements key={selected.npc.id} person={selected} {...learning} />
      </article>
    </div>
  );
}
