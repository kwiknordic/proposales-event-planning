// Landing section "What I learned building it": four short lessons from the build.
// Used in app/page.tsx. Copy is final (docs/LANDING.md section 5).

const lessons = [
  {
    title: "Test what the client sees.",
    text: "The hotel's editor and the client's proposal page render the same proposal differently. A feature is only done when it works on the client's side.",
  },
  {
    title: "Trust the real API over the docs.",
    text: "Calling the API early and writing tests against its real responses saved me from bugs that unit tests alone could not catch.",
  },
  {
    title: "Simple rules beat clever ones.",
    text: "Whether the hotel is emailed follows a small, fixed rule that anyone can read and test. Simple checks are easier to trust, explain and change.",
  },
  {
    title: "AI where it clearly helps.",
    text: "I use a model for one narrow judgment, whether a change is urgent, and only to decide what goes on top of the email. It never decides whether the hotel hears about a change.",
  },
];

export function Lessons() {
  return (
    <section className="section-landing">
      <div className="container-wide">
        <h2>What I learned building it</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {lessons.map((lesson) => (
            <div key={lesson.title}>
              <h3>{lesson.title}</h3>
              <p className="mt-2">{lesson.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
