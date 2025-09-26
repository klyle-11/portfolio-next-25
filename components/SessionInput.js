function SessionInput(props) {

    const changeSessionTime = (e) => {
        console.log(e)
        props.changeSessionTime(e.target.value)
    }

    return(
        <div>
            <select name='session' onChange={changeSessionTime} >
                <option value='25'>25</option>
                <option value='50'>50</option>
            </select>
        </div>
    );
}

export default SessionInput;