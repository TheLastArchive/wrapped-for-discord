const db_access = require("./database/data_access");

async function handle_wrapped() {
    const users = await db_access.get_all_users();
    // const [start, end] = get_start_and_end_of_previous_month();
    const [start, end] = get_start_and_end_of_month();
    // console.log(users[0].display_name);
    await db_access.count_user_history(users[0].user_id, start, end);
}

function get_start_and_end_of_month() {
    const date = new Date();
    const start = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
    return [start, end];
}

function get_start_and_end_of_previous_month() {
    const date = new Date();

    const start = new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
    const end = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    return [start, end];
}

handle_wrapped();
// get_start_and_end_of_month();
