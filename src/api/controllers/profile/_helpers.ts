import { revalidatePath } from "#/api/config/revalidate";

export function revalidateProfileViews() {
	revalidatePath("/me");
	revalidatePath("/feed");
	revalidatePath("/members");
}
