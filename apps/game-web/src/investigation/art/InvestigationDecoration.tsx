import './decoration.css';
import brass from './pushpin-brass.svg';import dark from './pushpin-dark.svg';import ring from './binder-ring.svg';import corner from './notebook-corner.svg';import clip from './paper-clip.svg';
export function InvestigationDecoration({kind,variant='brass',className=''}:{kind:'pushpin'|'ring'|'corner'|'clip';variant?:'brass'|'dark';className?:string}) {
 const url=kind==='pushpin'?(variant==='brass'?brass:dark):kind==='ring'?ring:kind==='corner'?corner:clip;
 return <img className={`investigation-decoration decoration-${kind} ${className}`} src={url} alt="" aria-hidden="true" draggable={false}/>;
}
