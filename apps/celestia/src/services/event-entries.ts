import Axios from 'axios';

export interface EventEntryBody {
  link: string;
  title: string;
  prevSrc: string | null;
}

/** The entrant's (or staff's) management of a submission; the event may have to be ongoing */
export class EventEntriesService {
  static get = (id: number) => Axios.get<EventEntryBody>(`/event-entries/${id}`);

  static update = (id: number, body: EventEntryBody) => Axios.put<unknown>(`/event-entries/${id}`, body);

  static remove = (id: number) => Axios.delete<unknown>(`/event-entries/${id}`);
}
