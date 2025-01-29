import { cancel, intro, isCancel, outro, select, text } from "@clack/prompts";
import fs from "fs/promises";
import { pastel } from "gradient-string";
import path from "path";
import picocolors from "picocolors";
import { URL } from "url";

const banner = [
    "    _    ___      _                    _     ____  ____  _  __",
    "   / \\  |_ _|    / \\   __ _  ___ _ __ | |_  / ___||  _ \\| |/ /",
    "  / _ \\  | |    / _ \\ / _` |/ _ \\ '_ \\| __| \\___ \\| | | | ' /",
    " / ___ \\ | |   / ___ \\ (_| |  __/ | | | |_   ___) | |_| | . \\",
    "/_/   \\_\\___| /_/   \\_\\__, |\\___|_| |_|\\__| |____/|____/|_|\\_\\",
    "                      |___/",
];

console.log(pastel(banner.join("\n")));

const { green, red } = picocolors;

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const TEMPLATES_DIR = path.resolve(__dirname, "..", "templates");

async function main() {
    intro("Build autonomous AI agents for the Zero-Employee Enterprise (ZEE).");

    const projectName = await text({
        message: "What is the name of your project?",
        validate: (value) => {
            if (value.length === 0) return "Project name is required";
            if (!/^[a-z0-9-]+$/.test(value))
                return "Project name can only contain lowercase letters, numbers, and dashes";
            return;
        },
    });

    if (isCancel(projectName)) {
        cancel("Operation cancelled");
        process.exit(0);
    }

    const openaiApiKey = await text({
        message:
            "Please input your OpenAI API key (will be stored in .env file)",
        validate: (value) => {
            if (value.length === 0) return "OpenAI API key is required";
            return;
        },
    });

    if (isCancel(openaiApiKey)) {
        cancel("Operation cancelled");
        process.exit(0);
    }

    const template = await select({
        message: "Choose the template you want to use",
        options: [
            {
                value: "001-zee-barebones",
                label: "Just a barebones template",
            },
        ],
    });

    if (isCancel(template)) {
        cancel("Operation cancelled");
        process.exit(0);
    }

    const targetDir = path.join(process.cwd(), projectName);
    const templateDir = path.resolve(TEMPLATES_DIR, template);

    try {
        // Create project directory
        await fs.mkdir(targetDir, { recursive: true });

        // Copy template files
        await copyTemplateFiles(templateDir, targetDir);

        // Create .env file with OpenAI API key
        const envPath = path.join(targetDir, ".env");
        await fs.writeFile(envPath, `OPENAI_API_KEY=${openaiApiKey}\n`, {
            flag: "a",
        });

        // Update package.json with project name
        const packageJsonPath = path.join(targetDir, "package.json");
        const packageJson = JSON.parse(
            await fs.readFile(packageJsonPath, "utf-8")
        );
        packageJson.name = projectName;
        await fs.writeFile(
            packageJsonPath,
            JSON.stringify(packageJson, null, 2)
        );

        // Update agent name in index.ts
        const indexTsPath = path.join(targetDir, "src/index.ts");
        const indexTsContent = await fs.readFile(indexTsPath, "utf-8");
        const updatedContent = indexTsContent.replace(
            /name: ['"].*?['"].*?\/\/ REPLACE/,
            `name: '${projectName}'`
        );
        await fs.writeFile(indexTsPath, updatedContent);

        outro(green("Project created successfully! 🎉"));
        console.log("\nNext steps:");
        console.log(`  cd ${projectName}`);
        console.log("  npm install");
        console.log("  npm run dev");
    } catch (error) {
        console.error(red("Error creating project:"), error);
        process.exit(1);
    }
}

async function copyTemplateFiles(source: string, target: string) {
    const files = await fs.readdir(source, { withFileTypes: true });

    for (const file of files) {
        const sourcePath = path.join(source, file.name);
        const targetPath = path.join(target, file.name);

        if (file.isDirectory()) {
            await fs.mkdir(targetPath, { recursive: true });
            await copyTemplateFiles(sourcePath, targetPath);
        } else {
            await fs.copyFile(sourcePath, targetPath);
        }
    }
}

main().catch(console.error);
