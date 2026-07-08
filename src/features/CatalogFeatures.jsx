import { useMemo, useState } from "react";

export function createCatalogFeatures(deps) {
  const {
    Button,
    Card,
    DeleteConfirmation,
    FormGrid,
    Icons,
    Modal,
    PlainInput,
    SelectBox,
    TextInput,
    includes,
  } = deps;

  function CourseForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(
      initial || { code: "", title: "", credits: 3 },
    );
    return (
      <div className="space-y-4">
        <FormGrid>
          <PlainInput
            label="Code"
            value={form.code}
            onChange={(value) =>
              setForm({ ...form, code: value.toUpperCase() })
            }
          />
          <PlainInput
            label="Credits"
            type="number"
            value={form.credits}
            onChange={(value) => setForm({ ...form, credits: value })}
          />
        </FormGrid>
        <PlainInput
          label="Course title"
          value={form.title}
          onChange={(value) => setForm({ ...form, title: value })}
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.code || !form.title}
            onClick={() => onSave({ ...form, credits: Number(form.credits) })}
          >
            Save course
          </Button>
        </div>
      </div>
    );
  }

  function Courses({
    courses,
    setCourses,
    setLecturers,
    setTermPlottings,
    setCourseClassPlans,
  }) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("code");
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const rows = useMemo(
      () =>
        courses
          .filter(
            (course) =>
              includes(course.code, query) ||
              includes(course.title, query) ||
              includes(course.credits, query),
          )
          .sort((a, b) => String(a[sort]).localeCompare(String(b[sort]))),
      [courses, query, sort],
    );
    const save = (item) => {
      setCourses((prev) =>
        prev.some((course) => course.code === item.code)
          ? prev.map((course) => (course.code === item.code ? item : course))
          : [item, ...prev],
      );
      setModal(null);
    };
    const remove = (code) => {
      setCourses((prev) => prev.filter((course) => course.code !== code));
      setLecturers((prev) =>
        prev.map((lecturer) => ({
          ...lecturer,
          plotted: lecturer.plotted.filter((item) => item !== code),
        })),
      );
      setTermPlottings((prev) =>
        prev.map((row) => ({
          ...row,
          plotted: row.plotted.filter((item) => item !== code),
        })),
      );
      setCourseClassPlans((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([termCode, plan]) => [
            termCode,
            {
              counts: Object.fromEntries(
                Object.entries(plan?.counts || {}).filter(
                  ([courseCode]) => courseCode !== code,
                ),
              ),
              assignments: Object.fromEntries(
                Object.entries(plan?.assignments || {}).filter(
                  ([courseCode]) => courseCode !== code,
                ),
              ),
            },
          ]),
        ),
      );
      setDeleteTarget(null);
    };
    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button onClick={() => setModal({})}>
            <Icons.plus className="h-4 w-4" />
            New course
          </Button>
        </div>
        <Card className="grid items-end gap-3 p-4 md:grid-cols-[1fr_220px]">
          <TextInput
            icon={Icons.search}
            value={query}
            onChange={setQuery}
            placeholder="Search by code, title, or credits..."
          />
          <SelectBox
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={["code", "title", "credits"]}
          />
        </Card>
        <Card className="divide-y divide-slate-100">
          {rows.map((course) => (
            <div
              key={course.code}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                  <Icons.book />
                </div>
                <div>
                  <p className="font-medium text-slate-950">
                    <span className="font-normal text-blue-700">
                      {course.code}
                    </span>{" "}
                    · {course.title}
                  </p>
                  <p className="text-sm font-normal text-slate-500">
                    {course.credits} credits
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(course)}>
                  <Icons.edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(course)}>
                  <Icons.trash className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="p-6 text-center text-sm text-slate-500">
              No courses match your search.
            </p>
          )}
        </Card>
        {modal && (
          <Modal
            title={modal.code ? "Edit course" : "New course"}
            onClose={() => setModal(null)}
          >
            <CourseForm
              initial={modal.code ? modal : null}
              onSave={save}
              onClose={() => setModal(null)}
            />
          </Modal>
        )}
        {deleteTarget && (
          <DeleteConfirmation
            itemType="course"
            itemLabel={`${deleteTarget.code} - ${deleteTarget.title}`}
            detail="This removes the course from the catalog, every term plotting, and all stored class plans."
            onConfirm={() => remove(deleteTarget.code)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    );
  }

  function TermForm({ initial, onSave, onClose }) {
    const [form, setForm] = useState(
      initial || {
        name: "",
        code: "",
        ay: "2025/2026",
        semester: "Semester 1",
        active: false,
      },
    );
    return (
      <div className="space-y-4">
        <PlainInput
          label="Term name"
          value={form.name}
          onChange={(value) => setForm({ ...form, name: value })}
        />
        <FormGrid>
          <PlainInput
            label="Code"
            value={form.code}
            onChange={(value) => setForm({ ...form, code: value })}
          />
          <PlainInput
            label="Academic year"
            value={form.ay}
            onChange={(value) => setForm({ ...form, ay: value })}
          />
        </FormGrid>
        <FormGrid>
          <PlainInput
            label="Semester"
            value={form.semester}
            onChange={(value) => setForm({ ...form, semester: value })}
          />
          <label className="mt-7 flex items-center gap-2 text-sm font-normal text-slate-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) =>
                setForm({ ...form, active: event.target.checked })
              }
            />{" "}
            Set as active term
          </label>
        </FormGrid>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!form.name || !form.code}
            onClick={() => onSave(form)}
          >
            Save term
          </Button>
        </div>
      </div>
    );
  }

  function Terms({
    terms,
    setTerms,
    setTermPlottings,
    setCourseClassPlans,
    onActiveTermChange,
  }) {
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState("name");
    const [modal, setModal] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const rows = terms
      .filter((term) =>
        [
          term.name,
          term.code,
          term.ay,
          term.semester,
          term.active ? "active" : "inactive",
        ].some((value) => includes(value, query)),
      )
      .sort((a, b) => String(a[sort]).localeCompare(String(b[sort])));
    const save = (item) => {
      setTerms((prev) => {
        const next = prev.some((term) => term.code === item.code)
          ? prev.map((term) => (term.code === item.code ? item : term))
          : [item, ...prev];
        return item.active
          ? next.map((term) => ({ ...term, active: term.code === item.code }))
          : next;
      });
      if (item.active) onActiveTermChange(item.code);
      setModal(null);
    };
    const remove = (code) => {
      setTerms((prev) => prev.filter((term) => term.code !== code));
      setTermPlottings((prev) => prev.filter((row) => row.term_code !== code));
      setCourseClassPlans((prev) =>
        Object.fromEntries(
          Object.entries(prev).filter(([termCode]) => termCode !== code),
        ),
      );
      setDeleteTarget(null);
    };
    return (
      <div className="space-y-5">
        <div className="flex justify-end">
          <Button onClick={() => setModal({})}>
            <Icons.plus className="h-4 w-4" />
            New term
          </Button>
        </div>
        <Card className="grid items-end gap-3 p-4 md:grid-cols-[1fr_220px]">
          <TextInput
            icon={Icons.search}
            value={query}
            onChange={setQuery}
            placeholder="Search term, code, year, semester, or status..."
          />
          <SelectBox
            label="Sort by"
            value={sort}
            onChange={setSort}
            options={["name", "code", "ay", "semester"]}
          />
        </Card>
        {rows.map((term) => (
          <Card key={term.code} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Icons.check
                  className={
                    term.active
                      ? "h-6 w-6 text-emerald-500"
                      : "h-6 w-6 text-slate-300"
                  }
                />
                <div>
                  <p className="text-lg font-medium text-slate-950">
                    {term.name}
                  </p>
                  <p className="text-sm font-normal text-slate-500">
                    {term.code} · AY {term.ay} · {term.semester} ·{" "}
                    {term.active ? "active" : "inactive"}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModal(term)}>
                  <Icons.edit className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteTarget(term)}>
                  <Icons.trash className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="p-6 text-center text-sm text-slate-500">
            No terms match your search.
          </p>
        )}
        {modal && (
          <Modal
            title={modal.code ? "Edit term" : "New term"}
            onClose={() => setModal(null)}
          >
            <TermForm
              initial={modal.code ? modal : null}
              onSave={save}
              onClose={() => setModal(null)}
            />
          </Modal>
        )}
        {deleteTarget && (
          <DeleteConfirmation
            itemType="academic term"
            itemLabel={`${deleteTarget.name} (${deleteTarget.code})`}
            detail="This removes the term and its dependent plotting records and class plans."
            onConfirm={() => remove(deleteTarget.code)}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </div>
    );
  }

  return { Courses, Terms };
}
