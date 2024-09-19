--create replace 
create or replace procedure xyz as
    test_var varchar2(2005);
begin
    /*
    create
    replace
    end
    */
    test_var := NUll;
    test_var := 'select this into a variable where';
    select x intO test_var from tbL_USerS;
end;