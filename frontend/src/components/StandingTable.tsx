import { StandingsGroup } from "@/lib/api";

export default function StandingsTable({ groups }: { groups: StandingsGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.group ?? "total"}>
          {group.group && (
            <p className="font-mono text-xs text-[#C4791F] uppercase tracking-widest mb-3">
              {group.group}
            </p>
          )}
          <div className="border border-[#E4E0D4] bg-white rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E4E0D4] text-[#6B7A70]">
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider py-2 pl-4 pr-2">
                    #
                  </th>
                  <th className="text-left font-mono text-[10px] uppercase tracking-wider py-2">
                    Team
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 px-2">
                    P
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 px-2">
                    W
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 px-2">
                    D
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 px-2">
                    L
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 px-2">
                    GD
                  </th>
                  <th className="text-center font-mono text-[10px] uppercase tracking-wider py-2 pr-4">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.table.map((entry, i) => (
                  <tr
                    key={entry.team.id}
                    className={i !== group.table.length - 1 ? "border-b border-[#F0EDE3]" : ""}
                  >
                    <td className="font-mono text-xs text-[#6B7A70] py-2.5 pl-4 pr-2">
                      {entry.position}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <img src={entry.team.crest} alt="" className="w-4 h-4 object-contain shrink-0" />
                        <span className="text-[#14201A] truncate">{entry.team.name}</span>
                      </div>
                    </td>
                    <td className="text-center font-mono text-xs text-[#14201A] py-2.5 px-2">
                      {entry.playedGames}
                    </td>
                    <td className="text-center font-mono text-xs text-[#14201A] py-2.5 px-2">
                      {entry.won}
                    </td>
                    <td className="text-center font-mono text-xs text-[#14201A] py-2.5 px-2">
                      {entry.draw}
                    </td>
                    <td className="text-center font-mono text-xs text-[#14201A] py-2.5 px-2">
                      {entry.lost}
                    </td>
                    <td className="text-center font-mono text-xs text-[#14201A] py-2.5 px-2">
                      {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                    </td>
                    <td className="text-center font-mono text-sm font-semibold text-[#C4791F] py-2.5 pr-4">
                      {entry.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}