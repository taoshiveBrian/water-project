import { Head } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import Heading from '@/components/heading';
import { TabNav } from '@/components/tab-nav';
import { dashboard } from '@/routes';
import { extraInfo } from '@/routes/dashboard';

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="grid gap-3 rounded-xl border border-sidebar-border/70 p-5 dark:border-sidebar-border">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <div className="grid gap-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
                {children}
            </div>
        </section>
    );
}

function Code({ children }: { children: string }) {
    return (
        <pre className="overflow-x-auto rounded-lg bg-muted p-3 font-mono text-xs text-foreground">
            {children}
        </pre>
    );
}

function Pairs({ rows }: { rows: [string, string][] }) {
    return (
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-[max-content_1fr]">
            {rows.map(([term, detail]) => (
                <div key={term} className="contents">
                    <dt className="font-medium text-foreground">{term}</dt>
                    <dd>{detail}</dd>
                </div>
            ))}
        </dl>
    );
}

type PackageInfo = {
    name: string;
    version: string;
    purpose: string;
};

function PackageList({ packages }: { packages: PackageInfo[] }) {
    return (
        <ul className="divide-y">
            {packages.map((pkg) => (
                <li
                    key={pkg.name}
                    className="grid gap-1 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[14rem_1fr]"
                >
                    <div>
                        <code className="font-medium text-foreground">
                            {pkg.name}
                        </code>
                        <span className="ml-2 text-xs">{pkg.version}</span>
                    </div>
                    <div>{pkg.purpose}</div>
                </li>
            ))}
        </ul>
    );
}

const projectAddOns: PackageInfo[] = [
    {
        name: 'maplibre-gl',
        version: '6.11.2',
        purpose:
            'Open-source vector map rendering (WebGL). No Mapbox token or per-load billing. Used on Dashboard → Map with free OpenFreeMap tiles.',
    },
    {
        name: 'react-map-gl',
        version: '8.1.3',
        purpose:
            'React wrapper for MapLibre (import from react-map-gl/maplibre). Powers the zone map. Maps only work in the browser, so they’re loaded client-side with React.lazy.',
    },
    {
        name: 'echarts',
        version: '6.1.0',
        purpose:
            'Charts, especially large time series with zoom/pan. Import from echarts/core and register only the charts you use to keep the bundle small.',
    },
    {
        name: 'date-fns',
        version: '4.4.0',
        purpose:
            'Date formatting and math. Import only the functions you need, so unused ones stay out of the bundle.',
    },
];

const pythonPackages: PackageInfo[] = [
    {
        name: 'matplotlib',
        version: '3.10.9',
        purpose:
            'Charts and figures rendered to image files from scripts run via Laravel’s Process facade. See the Processes tab.',
    },
    {
        name: 'numpy',
        version: '2.4.6',
        purpose: 'Numeric arrays. Installed as a matplotlib dependency.',
    },
    {
        name: 'torch (PyTorch)',
        version: 'not installed yet',
        purpose:
            'Machine-learning models for visual work. In python/requirements.txt (commented out). Install the CPU build (~200 MB) with: python/venv/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu',
    },
];

const backendPackages: PackageInfo[] = [
    {
        name: 'laravel/framework',
        version: '13.33.0',
        purpose: 'The Laravel framework itself (PHP 8.4).',
    },
    {
        name: 'inertiajs/inertia-laravel',
        version: '3.4.0',
        purpose:
            'Server side of Inertia: controllers return Inertia::render() pages instead of Blade views or an API.',
    },
    {
        name: 'laravel/fortify',
        version: '1.40.0',
        purpose:
            'Authentication backend: login, registration, password reset, email verification, two-factor auth.',
    },
    {
        name: 'laravel/wayfinder',
        version: '0.1.21',
        purpose:
            'Generates typed TypeScript functions for routes/controllers (@/routes, @/actions), so the frontend never hard-codes URLs.',
    },
    {
        name: 'intervention/image',
        version: '3.11.8',
        purpose:
            'Image processing for the media library (GD driver): compression and size variants.',
    },
    {
        name: 'laravel/tinker',
        version: '3.0.2',
        purpose:
            'REPL for running code in the app context (php artisan tinker).',
    },
];

const frontendPackages: PackageInfo[] = [
    {
        name: '@inertiajs/react',
        version: '3.x',
        purpose:
            'Client side of Inertia: pages, <Link>, <Form>, router, useHttp for JSON requests.',
    },
    {
        name: 'react / react-dom',
        version: '19.2',
        purpose:
            'UI library. The React Compiler plugin handles memoization automatically.',
    },
    {
        name: 'tailwindcss',
        version: '4.x',
        purpose:
            'Utility CSS. Design tokens and dark mode live in resources/css.',
    },
    {
        name: '@radix-ui/*',
        version: 'various',
        purpose:
            'Accessible primitives (dialog, dropdown, select, tooltip…) behind the components in components/ui.',
    },
    {
        name: 'lucide-react',
        version: '0.475',
        purpose: 'Icon set.',
    },
    {
        name: 'sonner',
        version: '2.x',
        purpose:
            'Toast notifications. The server sends them with Inertia::flash("toast", …).',
    },
];

const devTooling: PackageInfo[] = [
    {
        name: 'pestphp/pest',
        version: '5.2.1',
        purpose: 'Test runner (php artisan test --compact).',
    },
    {
        name: 'laravel/pint',
        version: '1.32.1',
        purpose: 'PHP code formatter (vendor/bin/pint).',
    },
    {
        name: 'larastan/larastan',
        version: '3.12.2',
        purpose: 'PHPStan static analysis with Laravel awareness.',
    },
    {
        name: 'laravel/boost',
        version: '2.10.0',
        purpose:
            'AI-assistant tooling: project guidelines, skills, and MCP tools (docs search, DB schema, logs).',
    },
    {
        name: 'laravel/pail',
        version: '1.2.7',
        purpose: 'Tail application logs in the terminal (php artisan pail).',
    },
    {
        name: 'laravel/sail',
        version: '1.68.0',
        purpose: 'Optional Docker dev environment. Not used on this server.',
    },
    {
        name: 'laravel/chisel',
        version: '0.1.1',
        purpose:
            'Toolkit for scripts that strip unwanted code/files/dependencies (starter-kit tooling).',
    },
    {
        name: 'laravel/pao',
        version: '1.1.5',
        purpose: 'Compact, agent-friendly test output.',
    },
    {
        name: 'vite / vite-plus',
        version: '8.x / 0.3.0',
        purpose:
            'Asset bundling (npm run dev / build) and lint + format (npm run check).',
    },
    {
        name: 'typescript',
        version: '5.x',
        purpose: 'Type checking (npm run types:check).',
    },
];

const tabs = [
    { id: 'extensions', label: 'Extensions' },
    { id: 'cache-tables', label: 'Cache Tables' },
    { id: 'processes', label: 'Processes' },
    { id: 'other', label: 'Other' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function ExtensionsTab() {
    return (
        <>
            <Section title="Added for WaterComb">
                <PackageList packages={projectAddOns} />
            </Section>
            <Section title="Backend (Composer)">
                <PackageList packages={backendPackages} />
            </Section>
            <Section title="Frontend (npm)">
                <PackageList packages={frontendPackages} />
            </Section>
            <Section title="Python (python/venv)">
                <PackageList packages={pythonPackages} />
            </Section>
            <Section title="Dev tooling">
                <PackageList packages={devTooling} />
            </Section>
        </>
    );
}

function CacheTablesTab() {
    return (
        <>
            <Section title="Cache tables: what they are">
                <p>
                    Data from outside sources (slow, rate-limited, or expensive
                    to compute) is saved as a{' '}
                    <strong>temporary snapshot</strong> in Laravel's{' '}
                    <code>cache</code> table (<code>CACHE_STORE=database</code>
                    ). Pages then read and page through the snapshot instead of
                    calling the source on every request. Our own data comes
                    straight from the database and does not use this.
                </p>
                <p>
                    It is <strong>not</strong> a permanent copy of the data. If
                    a feature needs data that is always current, can be searched
                    with SQL, or is updated a little at a time, build a real
                    table with a sync job instead.
                </p>
            </Section>

            <Section title="How a snapshot is stored">
                <Pairs
                    rows={[
                        [
                            'Key',
                            'dataset_cache_{dataset} or dataset_cache_{dataset}_{scope}. One key per dataset + scope, so snapshots never overwrite each other.',
                        ],
                        [
                            'Value',
                            '{ rows: [...], synced_at: ISO-8601 string }, stored as plain arrays so it doesn’t depend on any model’s structure.',
                        ],
                        [
                            'TTL',
                            '20 minutes by default (DATASET_CACHE_TTL_MINUTES). The clock starts at sync time. Reading the data does not extend it.',
                        ],
                        [
                            'Expired',
                            'Reads as “not synced” (null). No stale data is served; Re-sync to load it again.',
                        ],
                        [
                            'Listing',
                            'The cache can’t list its own keys. Known datasets are whatever is registered in config/datasets.php.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Where the code lives">
                <Pairs
                    rows={[
                        [
                            'config/datasets.php',
                            'TTL and the registry of dataset name → source class.',
                        ],
                        [
                            'DatasetSource',
                            'app/Services/Datasets/DatasetSource.php. The interface a source implements: fetch(?string $scope): array.',
                        ],
                        [
                            'DatasetCache',
                            'app/Services/Datasets/DatasetCache.php. Methods: sync, get, paginate, forget, exists.',
                        ],
                        [
                            'DatasetController',
                            'JSON endpoints used by the frontend.',
                        ],
                        [
                            'CachedDatasetPanel',
                            'resources/js/components/cached-dataset-panel.tsx. Reusable Sync button, “last synced” label, and paged table. Not used on any page yet.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Adding a new external source">
                <p>
                    <strong>1.</strong> Implement the interface. Return a list
                    of plain arrays:
                </p>
                <Code>{`namespace App\\Services\\Datasets\\Sources;

use App\\Services\\Datasets\\DatasetSource;
use Illuminate\\Support\\Facades\\Http;

class UsgsGauges implements DatasetSource
{
    public function fetch(?string $scope = null): array
    {
        return Http::timeout(15)
            ->get('https://example.test/gauges', ['site' => $scope])
            ->throw()
            ->json('data');
    }
}`}</Code>
                <p>
                    <strong>2.</strong> Register it under a route-safe name:
                </p>
                <Code>{`// config/datasets.php
'sources' => [
    'usgs-gauges' => UsgsGauges::class,
],`}</Code>
                <p>
                    <strong>3.</strong> Show it anywhere in the UI:
                </p>
                <Code>{`<CachedDatasetPanel
    dataset="usgs-gauges"
    scope="09380000"          // optional
    title="Lees Ferry gauge"
    columns={[{ key: 'recorded_at', label: 'Recorded' }]}
/>`}</Code>
            </Section>

            <Section title="Endpoints (auth required)">
                <Pairs
                    rows={[
                        [
                            'GET /datasets/{dataset}',
                            '?page=N&scope=… → { synced, synced_at, paginator }. The paginator has the same shape as an Eloquent page (current_page, last_page, total, data…), 50 per page.',
                        ],
                        [
                            'POST /datasets/{dataset}/sync',
                            'Fetches from the source, overwrites the snapshot, and starts a new TTL window → { count, synced_at }.',
                        ],
                        ['DELETE /datasets/{dataset}', 'Clears the snapshot.'],
                        [
                            'scope',
                            'Optional. Letters, numbers, dashes, and underscores, up to 100 characters. An unknown dataset returns 404.',
                        ],
                    ]}
                />
                <p>From PHP you can skip HTTP and use the service directly:</p>
                <Code>{`$datasets = app(DatasetCache::class);

$datasets->sync('usgs-gauges', '09380000');
$snapshot = $datasets->get('usgs-gauges', '09380000'); // null when expired
$page = $datasets->paginate('usgs-gauges', '09380000', page: 2);`}</Code>
            </Section>
        </>
    );
}

function ProcessesTab() {
    return (
        <>
            <Section title="What Processes are">
                <p>
                    Laravel's <strong>Process</strong> facade (
                    <code>Illuminate\Support\Facades\Process</code>) runs
                    external commands from PHP and captures their output, exit
                    code and errors. It's how we call Python (or any other
                    language) from the app. Under the hood it's Symfony Process.
                </p>
                <p>
                    We use it for occasional visual work that Python does
                    better: <strong>matplotlib</strong> figures now, and
                    possibly <strong>PyTorch</strong> models later. PHP starts
                    the script, the script writes a file or prints its result,
                    and PHP picks it up.
                </p>
            </Section>

            <Section title="Python setup in this project">
                <Pairs
                    rows={[
                        [
                            'python/',
                            'All Python scripts live here, at the project root next to app/.',
                        ],
                        [
                            'python/venv/',
                            'The project’s own Python 3.11 virtual environment. Always run scripts with python/venv/bin/python, never the system python3. It’s git-ignored.',
                        ],
                        [
                            'python/requirements.txt',
                            'Pinned dependencies. Currently matplotlib 3.10 (with numpy 2.4). torch is listed but commented out.',
                        ],
                        [
                            'Install / update',
                            'python/venv/bin/pip install -r python/requirements.txt',
                        ],
                        [
                            'Fresh machine',
                            'python3 -m venv python/venv, then the install command above.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Contract between Laravel and a script">
                <Pairs
                    rows={[
                        [
                            'Input',
                            'Command-line arguments (file paths, ids, small options). For larger input, write a JSON file and pass its path.',
                        ],
                        [
                            'Output',
                            'Either write a file to a path Laravel gave you, or print JSON to stdout. Keep stdout for the result only.',
                        ],
                        [
                            'Errors',
                            'Exit non-zero and write the reason to stderr. Laravel checks successful() and reads errorOutput().',
                        ],
                        [
                            'Side effects',
                            'Scripts don’t touch the database or pick their own storage locations. Laravel owns both and passes paths in.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Example: render a matplotlib chart">
                <p>
                    <strong>python/plot_series.py</strong>: reads a JSON file
                    and writes a PNG.
                </p>
                <Code>{`import json
import sys

import matplotlib

matplotlib.use("Agg")  # no display on the server
import matplotlib.pyplot as plt

input_path, output_path = sys.argv[1], sys.argv[2]

with open(input_path) as f:
    data = json.load(f)

fig, ax = plt.subplots(figsize=(8, 3), dpi=150)
ax.plot(data["x"], data["y"])
ax.set_title(data.get("title", ""))
fig.tight_layout()
fig.savefig(output_path)`}</Code>
                <p>
                    <strong>Laravel side</strong>: write the input, run the
                    script, then store the PNG through AssetService like any
                    other file.
                </p>
                <Code>{`use Illuminate\\Support\\Facades\\Process;
use Illuminate\\Support\\Facades\\Storage;
use Illuminate\\Support\\Str;

$disk = Storage::disk('local');
$input = 'python-tmp/'.Str::uuid().'.json';
$output = 'python-tmp/'.Str::uuid().'.png';

$disk->put($input, json_encode(['x' => $x, 'y' => $y, 'title' => 'Flow']));

try {
    $result = Process::path(base_path('python'))
        ->env([
            'MPLBACKEND' => 'Agg',
            'MPLCONFIGDIR' => storage_path('app/matplotlib'),
        ])
        ->timeout(60)
        ->run([
            base_path('python/venv/bin/python'),
            'plot_series.py',
            $disk->path($input),
            $disk->path($output),
        ]);

    $result->throw(); // ProcessFailedException with stderr on failure

    // ...store $disk->path($output) as an Asset
} finally {
    $disk->delete([$input, $output]);
}`}</Code>
            </Section>

            <Section title="Useful Process methods">
                <Pairs
                    rows={[
                        [
                            'run([...])',
                            'Run and wait. Returns a result with successful(), output(), errorOutput(), exitCode().',
                        ],
                        [
                            'throw()',
                            'Turns a failed result into an exception that includes stderr.',
                        ],
                        [
                            'timeout(s) / idleTimeout(s)',
                            'Kill runaway scripts. The default is 60 seconds.',
                        ],
                        [
                            'path(dir) / env([...])',
                            'Working directory and environment variables for the script.',
                        ],
                        [
                            'input($string)',
                            'Send data on stdin instead of writing a temp file.',
                        ],
                        [
                            'start()',
                            'Run in the background. Check running() and wait() later.',
                        ],
                        [
                            'pool() / pipe()',
                            'Run several scripts at once, or chain one’s output into the next.',
                        ],
                        [
                            'Process::fake()',
                            'In tests: pretend commands ran and assert with Process::assertRan(). Python isn’t needed to run the test suite.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Rules of thumb">
                <ul className="list-inside list-disc space-y-1.5">
                    <li>
                        <strong>Always pass the command as an array</strong>.
                        Each argument is escaped separately, so user-supplied
                        values can’t inject extra commands. Never build a
                        command string by concatenation.
                    </li>
                    <li>
                        <strong>
                            Anything slower than a second or two goes in a
                            queued job
                        </strong>
                        , not the web request. matplotlib startup alone is about
                        0.5–1s. PyTorch model loading can take several seconds,
                        so always queue it.
                    </li>
                    <li>
                        <strong>Set MPLCONFIGDIR</strong> to a writable folder
                        (the web server user usually has no home directory).
                        Otherwise matplotlib warns and rebuilds its font cache
                        on every run.
                    </li>
                    <li>
                        <strong>Cache generated images</strong>. If the input
                        hasn’t changed, reuse the stored asset instead of
                        re-rendering.
                    </li>
                    <li>
                        <strong>PyTorch</strong>: install the CPU build unless
                        the server gets a GPU. Load models once per run, not per
                        item. If calls become frequent, a small long-running
                        Python service (called over HTTP) beats starting a new
                        process each time.
                    </li>
                </ul>
            </Section>
        </>
    );
}

function OtherTab() {
    return (
        <>
            <Section title="Site details">
                <Pairs
                    rows={[
                        [
                            'Stack',
                            'Laravel 13, PHP 8.4, Inertia v3 + React 19 (server-side rendering on), Tailwind 4, Wayfinder route helpers, Fortify auth, Pest tests. SQLite database.',
                        ],
                        [
                            'Frontend libraries',
                            'maplibre-gl + react-map-gl (maps), echarts (charts, not used yet), date-fns (dates). Details in the Extensions tab.',
                        ],
                        [
                            'Python',
                            'Scripts in python/, run with python/venv/bin/python through the Process facade. matplotlib installed. Details in the Processes tab.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Dashboard pages">
                <Pairs
                    rows={[
                        [
                            'Dashboard',
                            '/dashboard. Placeholder layout for now.',
                        ],
                        [
                            'Map',
                            '/dashboard/map. The service-zone map (see below).',
                        ],
                        [
                            'Notes',
                            '/dashboard/notes. Your private article drafts, with Edit, Delete and “Make into a post”.',
                        ],
                        [
                            'Media Library',
                            '/dashboard/media. Every uploaded file, with Gallery, Settings and Queue tabs.',
                        ],
                        ['Extra Info', '/dashboard/extra-info. This page.'],
                        [
                            'Adding one',
                            'Every dashboard page gets a sidebar link (app-sidebar.tsx), a login-only route under /dashboard, and a page in resources/js/pages/dashboard/.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Map">
                <Pairs
                    rows={[
                        [
                            'Zone',
                            'A 30-mile circle around Taos, NM (87571), centred on the town centre (36.4072, -105.5731). The circle is computed as a true geodesic circle, so it stays accurate at this latitude.',
                        ],
                        [
                            'Tiles',
                            'OpenFreeMap “liberty” style: OpenStreetMap data, free, no API key. Change MAP_STYLE_URL to swap basemaps (MapTiler, self-hosted PMTiles, …).',
                        ],
                        [
                            'Code',
                            'resources/js/components/map/zone-map.tsx (map, ZONE_CENTER, ZONE_RADIUS_MILES) and map/geo.ts (circle and bounds helpers).',
                        ],
                        [
                            'Loading',
                            'MapLibre needs the browser, so the map loads client-side only, after the page mounts. A placeholder shows while it loads.',
                        ],
                        [
                            'Tabs',
                            'Overview, then 2–5. Cosmetic for now: they don’t change the map yet.',
                        ],
                        [
                            'Scroll zoom',
                            'Ctrl/Cmd + scroll zooms (two fingers on touch), so the page scrolls normally past the map.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Content and files">
                <Pairs
                    rows={[
                        [
                            'Articles',
                            '/articles. Three templates: Simple (title, subtitle, text), Article (sections with up to 5 inline images) and Guide (chapters with a contents sidebar). Any of them can be saved as a private draft and published later from Dashboard → Notes. Content is saved as JSON in articles.body.',
                        ],
                        [
                            'Files',
                            'Every upload (library or article editor) goes through AssetService: hashed name on the public disk under assets/{type}/{folder}, plus an assets row. Images are then compressed in their own format and get thumbnail/medium/large sizes, with the untouched original kept for reprocessing. GIFs are left alone.',
                        ],
                        [
                            'Processing',
                            'Immediate by default. Switch to queue in Media Library → Settings, which then needs php artisan queue:work running.',
                        ],
                        [
                            'Reuse',
                            'Editors can pick existing images with “Choose from library”. A file used by any article can’t be deleted from the library.',
                        ],
                        [
                            'File cleanup',
                            'An image uploaded through an article is deleted once no article uses it. Library uploads stay until deleted in the library. php artisan files:cleanup [--dry-run] removes untracked files.',
                        ],
                        [
                            'Upload limits',
                            'PHP’s limits apply on top of the app’s own (10 MB by default, in Media Library → Settings, which also shows the live PHP values). The dev server (php artisan serve, started by composer run dev) uses /etc/php/8.4/cli/php.ini. Apache uses /etc/php/8.4/apache2/php.ini, already set to 64M. Restart composer run dev after editing.',
                        ],
                    ]}
                />
            </Section>

            <Section title="Access">
                <Pairs
                    rows={[
                        [
                            'Login required',
                            'Everything under /dashboard and /datasets, and creating, editing, deleting or publishing articles.',
                        ],
                        [
                            'Public',
                            'The home page, /articles, and public published articles. Members-only articles and drafts return 404 to anyone but their author.',
                        ],
                    ]}
                />
            </Section>
        </>
    );
}

export default function ExtraInfo() {
    const [activeTab, setActiveTab] = useState<TabId>('extensions');

    return (
        <>
            <Head title="Extra Info" />
            <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
                <Heading
                    title="Extra Info"
                    description="Reference notes for the project."
                />

                <TabNav
                    tabs={tabs}
                    active={activeTab}
                    onChange={setActiveTab}
                    className="-mt-4"
                />

                {activeTab === 'extensions' && <ExtensionsTab />}
                {activeTab === 'cache-tables' && <CacheTablesTab />}
                {activeTab === 'processes' && <ProcessesTab />}
                {activeTab === 'other' && <OtherTab />}
            </div>
        </>
    );
}

ExtraInfo.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Extra Info', href: extraInfo() },
    ],
};
