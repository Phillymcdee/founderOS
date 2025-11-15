import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      <h1>Founder OS</h1>
      <p>Agent-native operating system for running your business.</p>
      <ul>
        <li>
          <Link href="/founder/business">Founder Dashboard – Business</Link>
        </li>
        <li>
          <Link href="/founder/ideas">Founder Dashboard – Ideas</Link>
        </li>
        <li>
          <Link href="/founder/settings">Founder Settings</Link>
        </li>
      </ul>
    </div>
  );
}


