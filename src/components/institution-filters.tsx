import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DirectoryFilters, DirectoryRow } from "@/lib/institution";
import { uniqueValues, yearOptions } from "@/lib/institution";

type Props = {
  rows: DirectoryRow[];
  filters: DirectoryFilters;
  onChange: (filters: DirectoryFilters) => void;
  showSearch?: boolean;
};

export function InstitutionFilters({ rows, filters, onChange, showSearch = true }: Props) {
  const departments = uniqueValues(rows, "department");
  const courses = uniqueValues(rows, "target_role_course");
  const years = yearOptions(rows);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {showSearch ? (
        <div>
          <Label htmlFor="directory-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <Input
            id="directory-search"
            value={filters.search}
            placeholder="Name, degree or goal"
            className="mt-1 min-h-11"
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </div>
      ) : null}

      <div>
        <Label className="text-xs text-muted-foreground">Department</Label>
        <Select value={filters.department} onValueChange={(value) => onChange({ ...filters, department: value })}>
          <SelectTrigger className="mt-1 min-h-11" aria-label="Filter by department">
            <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Year</Label>
        <Select value={filters.year} onValueChange={(value) => onChange({ ...filters, year: value })}>
          <SelectTrigger className="mt-1 min-h-11" aria-label="Filter by year of study">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All years</SelectItem>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                Year {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Course</Label>
        <Select value={filters.course} onValueChange={(value) => onChange({ ...filters, course: value })}>
          <SelectTrigger className="mt-1 min-h-11" aria-label="Filter by course">
            <SelectValue placeholder="All courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course} value={course}>
                {course}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
